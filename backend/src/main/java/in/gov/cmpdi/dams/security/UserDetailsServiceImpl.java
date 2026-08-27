package in.gov.cmpdi.dams.security;

import in.gov.cmpdi.dams.entity.User;
import in.gov.cmpdi.dams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmailAndIsDeletedFalse(username)
                .orElseGet(() -> userRepository.findByEmployeeIdAndIsDeletedFalse(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + username)));

        return UserPrincipal.create(user);
    }
}
