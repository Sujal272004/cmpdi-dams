package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByIdDesc();
    List<AuditLog> findByEntityNameAndEntityIdOrderByIdDesc(String entityName, String entityId);
}
