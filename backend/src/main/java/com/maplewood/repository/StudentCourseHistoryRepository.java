package com.maplewood.repository;

import com.maplewood.model.StudentCourseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentCourseHistoryRepository extends JpaRepository<StudentCourseHistory, Long> {

    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, String status);

    @Query("SELECT h FROM StudentCourseHistory h " +
            "JOIN FETCH h.course c " +
            "JOIN FETCH h.semester " +
            "LEFT JOIN FETCH c.specialization " +
            "WHERE h.student.id = :studentId")
    List<StudentCourseHistory> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    List<StudentCourseHistory> findByStudentId(Long studentId);
}
