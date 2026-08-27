package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrTargetRoleOrderByIdDesc(Long userId, String targetRole);
    List<Notification> findByIsReadFalseOrderByIdDesc();
}
