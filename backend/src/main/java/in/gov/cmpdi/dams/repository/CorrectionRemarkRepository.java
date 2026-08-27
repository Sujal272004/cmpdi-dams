package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.CorrectionRemark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorrectionRemarkRepository extends JpaRepository<CorrectionRemark, Long> {
    List<CorrectionRemark> findByReportIdOrderByIdDesc(Long reportId);
}
