package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateMachineRequest;
import server.olimpo.dto.request.UpdateMachineRequest;
import server.olimpo.dto.response.MachineResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.service.MachineService;
import server.olimpo.util.Pagination;

@RestController
@RequestMapping("/api/v1/machines")
@PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER')")
public class MachineController {

    private final MachineService machineService;

    public MachineController(MachineService machineService) {
        this.machineService = machineService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MachineResponse createMachine(@Valid @RequestBody CreateMachineRequest request) {
        return machineService.createMachine(request);
    }

    @GetMapping
    public PageResponse<MachineResponse> getAllMachines(
            @RequestParam(required = false, name = "status") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return machineService.getAllMachines(status, search,
                Pagination.request(page, size, Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"))));
    }

    @GetMapping("/{id}")
    public MachineResponse getMachineById(@PathVariable Long id) {
        return machineService.getMachineById(id);
    }

    @PatchMapping("/{id}")
    public MachineResponse updateMachine(@PathVariable Long id, @Valid @RequestBody UpdateMachineRequest request) {
        return machineService.updateMachine(id, request);
    }
}
