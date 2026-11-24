package server.olimpo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.dto.response.TrainerOptionResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.util.Pagination;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TrainerDirectoryService {

    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;

    public TrainerDirectoryService(TrainerRepository trainerRepository, UserRepository userRepository) {
        this.trainerRepository = trainerRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<TrainerOptionResponse> getTrainers(String search, Pageable pageable,
                                                            Authentication authentication) {
        Page<Trainer> trainers;
        if (hasRole(authentication, "ROLE_ADMIN") || hasRole(authentication, "ROLE_TRAINER_MANAGER")) {
            trainers = trainerRepository.searchTrainers(Pagination.normalizeSearch(search), pageable);
        } else if (hasRole(authentication, "ROLE_TRAINER")) {
            Trainer ownTrainer = resolveOwnTrainer(authentication);
            List<Trainer> content = pageable.getPageNumber() == 0 ? List.of(ownTrainer) : List.of();
            trainers = new PageImpl<>(content, pageable, 1);
        } else {
            throw new AccessDeniedException("Access denied");
        }

        List<Long> userIds = trainers.getContent().stream().map(Trainer::getUserId).toList();
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageResponse.from(trainers.map(trainer -> {
            User user = usersById.get(trainer.getUserId());
            if (user == null) {
                throw new ResourceNotFoundException("User not found for trainer id: " + trainer.getId());
            }
            return new TrainerOptionResponse(trainer.getId(), user.getFirstName(), user.getLastName(),
                    trainer.getSpecialty());
        }));
    }

    private Trainer resolveOwnTrainer(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        return trainerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No trainer profile found for this user"));
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(role));
    }
}
