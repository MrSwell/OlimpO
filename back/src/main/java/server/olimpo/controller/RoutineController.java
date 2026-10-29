package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateRoutineAssignmentRequest;
import server.olimpo.dto.request.CreateRoutineRequest;
import server.olimpo.dto.response.RoutineAssignmentResponse;
import server.olimpo.dto.response.RoutineResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.service.RoutineService;
import server.olimpo.util.Pagination;


/**
 * Training routines and their assignments to clients.
 * Manage: ADMIN, TRAINER_MANAGER, TRAINER. View (catalog): any authenticated role.
 */
@RestController
@RequestMapping("/api/v1")
public class RoutineController {

    private final RoutineService routineService;

    public RoutineController(RoutineService routineService) {
        this.routineService = routineService;
    }

    @GetMapping("/routines")
    public PageResponse<RoutineResponse> getAllRoutines(
            @RequestParam(required = false, name = "type") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return routineService.getAllRoutines(type, search,
                Pagination.request(page, size, Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"))));
    }

    @GetMapping("/routines/{id}")
    public RoutineResponse getRoutineById(@PathVariable Long id) {
        return routineService.getRoutineById(id);
    }

    @PostMapping("/routines")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponse createRoutine(@Valid @RequestBody CreateRoutineRequest request) {
        return routineService.createRoutine(request, org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication());
    }

    @PostMapping("/routines/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineAssignmentResponse assignRoutine(@PathVariable Long id,
                                                   @Valid @RequestBody CreateRoutineAssignmentRequest request) {
        return routineService.assignRoutine(id, request,
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
    }

    @GetMapping("/routines/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER', 'RECEPCIONIST')")
    public PageResponse<RoutineAssignmentResponse> getRoutineAssignments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return routineService.getRoutineAssignments(id, search,
                Pagination.request(page, size,
                        Sort.by(Sort.Order.desc("assignmentDate"), Sort.Order.desc("id"))));
    }

    @GetMapping("/clients/{clientId}/routines")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER', 'RECEPCIONIST', 'CLIENT')")
    public PageResponse<RoutineAssignmentResponse> getClientAssignments(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return routineService.getClientAssignments(clientId, search,
                Pagination.request(page, size,
                        Sort.by(Sort.Order.desc("assignmentDate"), Sort.Order.desc("id"))),
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
    }
}
