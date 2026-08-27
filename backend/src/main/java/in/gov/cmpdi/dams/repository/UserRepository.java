package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByIsDeletedFalse();
    Optional<User> findByEmailAndIsDeletedFalse(String email);
    Optional<User> findByEmployeeIdAndIsDeletedFalse(String employeeId);
    boolean existsByEmailAndIsDeletedFalse(String email);
    boolean existsByEmployeeIdAndIsDeletedFalse(String employeeId);
    List<User> findByCampIdAndIsDeletedFalse(Long campId);
}
