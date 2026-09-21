package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.DrillBit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrillBitRepository extends JpaRepository<DrillBit, Long> {

    List<DrillBit> findAllByIsDeletedFalseOrderByIdDesc();

    List<DrillBit> findByCampIdAndIsDeletedFalseOrderByIdDesc(Long campId);

    List<DrillBit> findByStatusAndIsDeletedFalseOrderByIdDesc(String status);

    List<DrillBit> findByCampIdAndStatusAndIsDeletedFalseOrderByIdDesc(Long campId, String status);

    Optional<DrillBit> findByIdAndIsDeletedFalse(Long id);

    Optional<DrillBit> findByBitNumberIgnoreCaseAndIsDeletedFalse(String bitNumber);

    boolean existsByBitNumberIgnoreCaseAndIsDeletedFalse(String bitNumber);

    boolean existsByBitNumberIgnoreCaseAndIdNotAndIsDeletedFalse(String bitNumber, Long id);

    long countByIsDeletedFalse();
}
