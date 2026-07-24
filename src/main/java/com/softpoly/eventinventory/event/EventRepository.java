package com.softpoly.eventinventory.event;

import com.softpoly.eventinventory.common.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    /** Public feed only ever exposes TICKETED events. */
    List<Event> findByType(EventType type);
}
