package com.softpoly.eventinventory.show;

import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.show.dto.TicketTypeRequest;
import com.softpoly.eventinventory.show.dto.TicketTypeResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketTypeService {

    private final TicketTypeRepository ticketTypeRepository;
    private final ShowRepository showRepository;

    public TicketTypeService(TicketTypeRepository ticketTypeRepository, ShowRepository showRepository) {
        this.ticketTypeRepository = ticketTypeRepository;
        this.showRepository = showRepository;
    }

    @Transactional
    public TicketTypeResponse create(Long showId, TicketTypeRequest dto) {
        if (!showRepository.existsById(showId)) {
            throw new ResourceNotFoundException("Show not found with id " + showId);
        }
        TicketType ticketType = TicketType.builder()
                .showId(showId)
                .name(dto.name())
                .price(dto.price())
                .totalQty(dto.totalQty())
                .availableQty(dto.totalQty()) // all seats available initially
                .build();
        return TicketTypeResponse.from(ticketTypeRepository.save(ticketType));
    }

    @Transactional(readOnly = true)
    public List<TicketTypeResponse> listByShow(Long showId) {
        return ticketTypeRepository.findByShowId(showId).stream().map(TicketTypeResponse::from).toList();
    }

    @Transactional
    public TicketTypeResponse update(Long id, TicketTypeRequest dto) {
        TicketType ticketType = findOrThrow(id);
        int alreadyTaken = ticketType.getTotalQty() - ticketType.getAvailableQty();
        if (dto.totalQty() < alreadyTaken) {
            throw new BadRequestException(
                    "Cannot set capacity below the " + alreadyTaken + " tickets already booked");
        }
        ticketType.setName(dto.name());
        ticketType.setPrice(dto.price());
        ticketType.setTotalQty(dto.totalQty());
        ticketType.setAvailableQty(dto.totalQty() - alreadyTaken);
        return TicketTypeResponse.from(ticketTypeRepository.save(ticketType));
    }

    @Transactional
    public void delete(Long id) {
        ticketTypeRepository.delete(findOrThrow(id));
    }

    private TicketType findOrThrow(Long id) {
        return ticketTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket type not found with id " + id));
    }
}
