package com.softpoly.eventinventory.event;

import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.event.dto.EventRequestDto;
import com.softpoly.eventinventory.event.dto.EventResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /** Public feed: only TICKETED events are ever exposed to users. */
    @Transactional(readOnly = true)
    public List<EventResponseDto> listPublicEvents() {
        return eventRepository.findByType(EventType.TICKETED).stream()
                .map(EventResponseDto::from)
                .toList();
    }

    /** Admin view: all events, both TICKETED and INVENTORY. */
    @Transactional(readOnly = true)
    public List<EventResponseDto> listAllEvents() {
        return eventRepository.findAll().stream()
                .map(EventResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponseDto getById(Long id) {
        return EventResponseDto.from(findOrThrow(id));
    }

    @Transactional
    public EventResponseDto create(EventRequestDto dto, Long adminId) {
        Event event = Event.builder()
                .title(dto.title())
                .description(dto.description())
                .type(dto.type())
                .category(dto.category())
                .venueName(dto.venueName())
                .city(dto.city())
                .posterUrl(dto.posterUrl())
                .startTime(dto.startTime())
                .createdBy(adminId)
                .build();
        return EventResponseDto.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponseDto update(Long id, EventRequestDto dto) {
        Event event = findOrThrow(id);
        event.setTitle(dto.title());
        event.setDescription(dto.description());
        event.setType(dto.type());
        event.setCategory(dto.category());
        event.setVenueName(dto.venueName());
        event.setCity(dto.city());
        event.setPosterUrl(dto.posterUrl());
        event.setStartTime(dto.startTime());
        return EventResponseDto.from(eventRepository.save(event));
    }

    @Transactional
    public void delete(Long id) {
        eventRepository.delete(findOrThrow(id));
    }

    private Event findOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + id));
    }
}
