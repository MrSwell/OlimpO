package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.service.TrainerDirectoryService;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainerDirectoryServiceTest {

    @Mock
    private TrainerRepository trainerRepository;
    @Mock
    private UserRepository userRepository;

    private TrainerDirectoryService service() {
        return new TrainerDirectoryService(trainerRepository, userRepository);
    }

    private Authentication auth(String email, String... roles) {
        var authorities = Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
        return new UsernamePasswordAuthenticationToken(email, null, authorities);
    }

    @Test
    @DisplayName("F6: supervisors search the trainer directory")
    void supervisorsGetTrainerDirectory() {
        var pageable = PageRequest.of(0, 20, Sort.by(Sort.Order.asc("id")));
        Trainer trainer = Trainer.builder().id(4L).userId(7L).specialty("Fuerza").build();
        User user = User.builder().id(7L).firstName("Ana").lastName("Ruiz").build();
        when(trainerRepository.searchTrainers("ana", pageable))
                .thenReturn(new PageImpl<>(List.of(trainer), pageable, 1));
        when(userRepository.findAllById(List.of(7L))).thenReturn(List.of(user));

        var response = service().getTrainers(" Ana ", pageable, auth("admin@olimpo.com", "ADMIN"));

        assertEquals(4L, response.content().getFirst().id());
        assertEquals("Ana", response.content().getFirst().firstName());
        assertEquals("Fuerza", response.content().getFirst().specialty());
    }

    @Test
    @DisplayName("F6: TRAINER lookup exposes only the authenticated trainer profile")
    void trainerGetsOwnProfile() {
        var pageable = PageRequest.of(0, 20, Sort.by(Sort.Order.asc("id")));
        Trainer trainer = Trainer.builder().id(4L).userId(7L).specialty("Fuerza").build();
        User user = User.builder().id(7L).email("trainer@olimpo.com")
                .firstName("Ana").lastName("Ruiz").build();
        when(userRepository.findByEmail("trainer@olimpo.com")).thenReturn(Optional.of(user));
        when(trainerRepository.findByUserId(7L)).thenReturn(Optional.of(trainer));
        when(userRepository.findAllById(List.of(7L))).thenReturn(List.of(user));

        var response = service().getTrainers(null, pageable, auth("trainer@olimpo.com", "TRAINER"));

        assertEquals(1, response.totalElements());
        assertEquals(4L, response.content().getFirst().id());
        verify(trainerRepository, never()).searchTrainers(null, pageable);
    }

    @Test
    @DisplayName("F6: roles outside training staff cannot query trainer profiles")
    void receptionistCannotGetTrainerDirectory() {
        assertThrows(AccessDeniedException.class, () -> service().getTrainers(null,
                PageRequest.of(0, 20), auth("recepcionista@olimpo.com", "RECEPCIONIST")));

        verifyNoInteractions(trainerRepository, userRepository);
    }
}
