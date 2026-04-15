package com.maplewood.repository;

import com.maplewood.model.SectionMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionMeetingRepository extends JpaRepository<SectionMeeting, Long> {

    List<SectionMeeting> findBySectionId(Long sectionId);
}
