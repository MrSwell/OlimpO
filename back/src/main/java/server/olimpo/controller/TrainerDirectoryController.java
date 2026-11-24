package server.olimpo.controller;

import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.dto.response.TrainerOptionResponse;
import server.olimpo.service.TrainerDirectoryService;
import server.olimpo.util.Pagination;

@RestController
@RequestMapping("/api/v1/trainers")
public class TrainerDirectoryController {

    private final TrainerDirectoryService trainerDirectoryService;

    public TrainerDirectoryController(TrainerDirectoryService trainerDirectoryService) {
        this.trainerDirectoryService = trainerDirectoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER')")
    public PageResponse<TrainerOptionResponse> getTrainers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        return trainerDirectoryService.getTrainers(search,
                Pagination.request(page, size, Sort.by(Sort.Order.asc("id"))), authentication);
    }
}
