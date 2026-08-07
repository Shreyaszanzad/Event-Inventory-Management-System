package com.softpoly.eventinventory.inventory;

import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.enums.InventoryCategory;
import com.softpoly.eventinventory.common.enums.InventoryStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.event.Event;
import com.softpoly.eventinventory.event.EventRepository;
import com.softpoly.eventinventory.inventory.dto.AllocateInventoryRequest;
import com.softpoly.eventinventory.inventory.dto.EventInventoryResponse;
import com.softpoly.eventinventory.inventory.dto.InventoryItemRequest;
import com.softpoly.eventinventory.inventory.dto.InventoryItemResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Inventory stock must behave like ticket stock: it can never go negative, and returning kit
 * must put back exactly what went out.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimsinvtest;DB_CLOSE_DELAY=-1;MODE=MySQL;LOCK_TIMEOUT=15000",
        "app.booking.sweeper-initial-ms=3600000"
})
class InventoryAllocationTest {

    @Autowired EventRepository eventRepository;
    @Autowired InventoryService inventoryService;
    @Autowired InventoryItemRepository itemRepository;

    private Long newEvent(String title) {
        return newEvent(title, EventType.INVENTORY);
    }

    private Long newEvent(String title, EventType type) {
        return eventRepository.save(Event.builder()
                .title(title)
                .type(type)
                .status("ACTIVE")
                .build()).getId();
    }

    private InventoryItemResponse newItem(String name, int qty) {
        return inventoryService.create(new InventoryItemRequest(
                name, "test fixture", InventoryCategory.FURNITURE, qty,
                new BigDecimal("10.00"), InventoryStatus.ACTIVE));
    }

    @Test
    void allocatingMovesStockAndReleasingPutsItBack() {
        Long eventId = newEvent("Allocation round trip");
        InventoryItemResponse item = newItem("Round trip chair", 100);

        EventInventoryResponse allocation = inventoryService.allocate(
                eventId, new AllocateInventoryRequest(item.id(), 30, "stage left"));

        assertThat(allocation.allocatedQty()).isEqualTo(30);
        assertThat(allocation.status()).isEqualTo("ALLOCATED");
        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(70);

        // Line value is quantity x unit price.
        assertThat(allocation.lineValue()).isEqualByComparingTo(new BigDecimal("300.00"));

        inventoryService.release(allocation.id(), true);

        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(100);
    }

    @Test
    void resizingAnAllocationMovesOnlyTheDelta() {
        Long eventId = newEvent("Resize");
        InventoryItemResponse item = newItem("Resizable table", 50);

        EventInventoryResponse allocation = inventoryService.allocate(
                eventId, new AllocateInventoryRequest(item.id(), 10, null));
        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(40);

        inventoryService.updateAllocation(allocation.id(), 15);   // +5
        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(35);

        inventoryService.updateAllocation(allocation.id(), 4);    // -11
        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(46);
    }

    @Test
    void cannotAllocateMoreThanIsAvailable() {
        Long eventId = newEvent("Over-allocate");
        InventoryItemResponse item = newItem("Scarce speaker", 5);

        assertThatThrownBy(() -> inventoryService.allocate(
                eventId, new AllocateInventoryRequest(item.id(), 6, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Not enough stock");

        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(5);
    }

    @Test
    void cannotShrinkCapacityBelowWhatIsAllocated() {
        Long eventId = newEvent("Shrink");
        InventoryItemResponse item = newItem("Shrinking drape", 20);
        inventoryService.allocate(eventId, new AllocateInventoryRequest(item.id(), 12, null));

        assertThatThrownBy(() -> inventoryService.update(item.id(), new InventoryItemRequest(
                "Shrinking drape", null, InventoryCategory.DECOR, 10,
                new BigDecimal("10.00"), InventoryStatus.ACTIVE)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already allocated");
    }

    @Test
    void retiredItemsCannotBeAllocated() {
        Long eventId = newEvent("Retired");
        InventoryItemResponse item = newItem("Broken fog machine", 3);
        inventoryService.update(item.id(), new InventoryItemRequest(
                "Broken fog machine", null, InventoryCategory.OTHER, 3,
                new BigDecimal("10.00"), InventoryStatus.RETIRED));

        assertThatThrownBy(() -> inventoryService.allocate(
                eventId, new AllocateInventoryRequest(item.id(), 1, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("retired");
    }

    @Test
    void theSameItemCannotBeAllocatedTwiceToOneEvent() {
        Long eventId = newEvent("Duplicate");
        InventoryItemResponse item = newItem("Duplicated chair", 30);
        inventoryService.allocate(eventId, new AllocateInventoryRequest(item.id(), 5, null));

        assertThatThrownBy(() -> inventoryService.allocate(
                eventId, new AllocateInventoryRequest(item.id(), 5, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already allocated");
    }

    @Test
    void inventoryCannotBeAllocatedToATicketedEvent() {
        Long ticketedEventId = newEvent("A ticketed concert", EventType.TICKETED);
        InventoryItemResponse item = newItem("Stage speaker", 10);

        assertThatThrownBy(() -> inventoryService.allocate(
                ticketedEventId, new AllocateInventoryRequest(item.id(), 2, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INVENTORY-type events");

        // and the stock must be untouched
        assertThat(itemRepository.findById(item.id()).orElseThrow().getAvailableQty()).isEqualTo(10);
    }

    @Test
    void listingInventoryForATicketedEventIsAlsoRejected() {
        Long ticketedEventId = newEvent("Another ticketed show", EventType.TICKETED);

        assertThatThrownBy(() -> inventoryService.listForEvent(ticketedEventId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INVENTORY-type events");
    }

    /**
     * The guarantee that matters: many admins racing for the last few units must never push
     * available_qty below zero. Mirrors BookingConcurrencyTest for ticket stock.
     */
    @Test
    void concurrentAllocationsNeverOverAllocate() throws InterruptedException {
        final int capacity = 20;
        final int threads = 40;   // each asks for 1 unit; only 20 can win

        InventoryItemResponse item = newItem("Contended speaker", capacity);
        Long[] eventIds = new Long[threads];
        for (int i = 0; i < threads; i++) {
            eventIds[i] = newEvent("Race event " + i);
        }

        ExecutorService pool = Executors.newFixedThreadPool(16);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger succeeded = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            final Long eventId = eventIds[i];
            pool.submit(() -> {
                try {
                    start.await();
                    inventoryService.allocate(eventId, new AllocateInventoryRequest(item.id(), 1, null));
                    succeeded.incrementAndGet();
                } catch (Exception ignored) {
                    // losing the race is the expected outcome for most threads
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();
        assertThat(done.await(60, TimeUnit.SECONDS)).isTrue();
        pool.shutdownNow();

        int remaining = itemRepository.findById(item.id()).orElseThrow().getAvailableQty();

        assertThat(succeeded.get()).isEqualTo(capacity);
        assertThat(remaining).isZero();
        assertThat(remaining).isNotNegative();
    }
}
