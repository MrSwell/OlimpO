package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
import server.olimpo.service.RoutineService;

import java.util.List;

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
    public List<RoutineResponse> getAllRoutines(
            @RequestParam(required = false, name = "type") String type) {
        return routineService.getAllRoutines(type);
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
    public List<RoutineAssignmentResponse> getRoutineAssignments(@PathVariable Long id) {
        return routineService.getRoutineAssignments(id);
    }

    @GetMapping("/clients/{clientId}/routines")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER', 'RECEPCIONIST', 'CLIENT')")
    public List<RoutineAssignmentResponse> getClientAssignments(@PathVariable Long clientId) {
        return routineService.getClientAssignments(clientId,
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
    }
}
