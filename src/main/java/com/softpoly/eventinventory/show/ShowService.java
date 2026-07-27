package com.softpoly.eventinventory.show;

import com.softpoly.eventinventory.common.enums.EventType;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.event.Event;
import com.softpoly.eventinventory.event.EventRepository;
import com.softpoly.eventinventory.show.dto.ShowRequest;
import com.softpoly.eventinventory.show.dto.ShowResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShowService {

    private final ShowRepository showRepository;
    private final EventRepository eventRepository;

    public ShowService(ShowRepository showRepository, EventRepository eventRepository) {
        this.showRepository = showRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public ShowResponse create(Long eventId, ShowRequest dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + eventId));
        if (event.getType() != EventType.TICKETED) {
            throw new BadRequestException("Shows can only be added to TICKETED events");
        }
        Show show = Show.builder()
                .eventId(eventId)
                .showDatetime(dto.showDatetime())
                .build();
        return ShowResponse.from(showRepository.save(show));
    }

    @Transactional(readOnly = true)
    public List<ShowResponse> listByEvent(Long eventId) {
        return showRepository.findByEventId(eventId).stream().map(ShowResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ShowResponse getById(Long id) {
        return ShowResponse.from(findOrThrow(id));
    }

    @Transactional
    public ShowResponse update(Long id, ShowRequest dto) {
        Show show = findOrThrow(id);
        show.setShowDatetime(dto.showDatetime());
        return ShowResponse.from(showRepository.save(show));
    }

    @Transactional
    public void delete(Long id) {
        showRepository.delete(findOrThrow(id));
    }

    private Show findOrThrow(Long id) {
        return showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id " + id));
    }
}
