package com.maplewood.repository;

import com.maplewood.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    long countByStudentIdAndSectionSemesterIdAndStatus(Long studentId, Long semesterId, String status);

    @Query("SELECT DISTINCT e FROM Enrollment e " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.course c " +
            "JOIN FETCH cs.teacher t " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.meetings m " +
            "LEFT JOIN FETCH m.classroom " +
            "LEFT JOIN FETCH m.timeslot " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH t.specialization " +
            "WHERE e.student.id = :studentId AND cs.semester.id = :semesterId")
    List<Enrollment> findByStudentIdAndSemesterIdWithDetails(@Param("studentId") Long studentId,
                                                             @Param("semesterId") Long semesterId);

    @Query("SELECT e FROM Enrollment e " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.course " +
            "WHERE e.student.id = :studentId AND cs.semester.id = :semesterId AND e.status = :status")
    List<Enrollment> findByStudentIdAndSemesterIdAndStatus(@Param("studentId") Long studentId,
                                                           @Param("semesterId") Long semesterId,
                                                           @Param("status") String status);

    boolean existsByStudentIdAndSectionCourseIdAndSectionSemesterIdAndStatus(
            Long studentId, Long courseId, Long semesterId, String status);

    long countBySectionIdAndStatus(Long sectionId, String status);

    Optional<Enrollment> findByStudentIdAndSectionId(Long studentId, Long sectionId);
}
