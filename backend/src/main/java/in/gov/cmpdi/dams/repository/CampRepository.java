package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.Camp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampRepository extends JpaRepository<Camp, Long> {
    List<Camp> findByIsDeletedFalse();
    Optional<Camp> findByIdAndIsDeletedFalse(Long id);
    Optional<Camp> findByCampCodeAndIsDeletedFalse(String campCode);
    boolean existsByCampCodeAndIsDeletedFalse(String campCode);
}
