package com.maplewood.repository;

import com.maplewood.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    @Query("SELECT DISTINCT cs FROM CourseSection cs " +
            "JOIN FETCH cs.course c " +
            "JOIN FETCH cs.teacher t " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.meetings m " +
            "LEFT JOIN FETCH m.classroom " +
            "LEFT JOIN FETCH m.timeslot " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH t.specialization " +
            "WHERE cs.course.id = :courseId AND cs.semester.id = :semesterId")
    List<CourseSection> findByCourseIdAndSemesterIdWithDetails(@Param("courseId") Long courseId,
                                                               @Param("semesterId") Long semesterId);

    @Query("SELECT DISTINCT cs FROM CourseSection cs " +
            "JOIN FETCH cs.course c " +
            "JOIN FETCH cs.teacher t " +
            "LEFT JOIN FETCH cs.meetings m " +
            "LEFT JOIN FETCH m.classroom " +
            "LEFT JOIN FETCH m.timeslot " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH t.specialization " +
            "WHERE cs.semester.id = :semesterId")
    List<CourseSection> findBySemesterIdWithDetails(@Param("semesterId") Long semesterId);

    @Query("SELECT DISTINCT cs FROM CourseSection cs " +
            "JOIN FETCH cs.course c " +
            "JOIN FETCH cs.teacher t " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.meetings m " +
            "LEFT JOIN FETCH m.classroom " +
            "LEFT JOIN FETCH m.timeslot " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH t.specialization " +
            "WHERE cs.id = :sectionId")
    Optional<CourseSection> findByIdWithDetails(@Param("sectionId") Long sectionId);
}
