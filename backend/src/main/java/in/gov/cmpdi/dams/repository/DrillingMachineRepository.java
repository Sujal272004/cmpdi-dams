package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.DrillingMachine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrillingMachineRepository extends JpaRepository<DrillingMachine, Long> {
    List<DrillingMachine> findByIsDeletedFalse();
    List<DrillingMachine> findByCampIdAndIsDeletedFalse(Long campId);
    Optional<DrillingMachine> findByIdAndIsDeletedFalse(Long id);
    Optional<DrillingMachine> findByMachineNumberIgnoreCaseAndIsDeletedFalse(String machineNumber);
    boolean existsByMachineNumberIgnoreCaseAndIsDeletedFalse(String machineNumber);
    long countByIsDeletedFalse();
    long countByStatusAndIsDeletedFalse(String status);
}
