package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.MachineTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineTargetRepository extends JpaRepository<MachineTarget, Long> {
    List<MachineTarget> findByMachineIdAndTargetYearOrderByMonthIndexAsc(Long machineId, Integer targetYear);
    List<MachineTarget> findByMachineId(Long machineId);
    Optional<MachineTarget> findByMachineIdAndTargetYearAndMonthName(Long machineId, Integer targetYear, String monthName);
    void deleteByMachineIdAndTargetYear(Long machineId, Integer targetYear);
    void deleteByMachineId(Long machineId);
}
