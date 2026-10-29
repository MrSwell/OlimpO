package server.olimpo.service;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateMachineRequest;
import server.olimpo.dto.request.UpdateMachineRequest;
import server.olimpo.dto.response.MachineResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.entity.Machine;
import server.olimpo.enums.MachineStatus;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.MachineRepository;
import server.olimpo.util.Pagination;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    @Transactional
    public MachineResponse createMachine(CreateMachineRequest request) {
        String status = request.status() == null
                ? MachineStatus.AVAILABLE.name()
                : validateStatus(request.status());

        String serialNumber = request.serialNumber();
        if (serialNumber != null && !serialNumber.isBlank() && machineRepository.existsBySerialNumber(serialNumber.trim())) {
            throw new BusinessException("A machine with serial number '" + serialNumber + "' already exists");
        }

        Machine machine = Machine.builder()
                .name(request.name().trim())
                .brand(request.brand())
                .model(request.model())
                .serialNumber(serialNumber != null ? serialNumber.trim() : null)
                .status(status)
                .build();
        return toResponse(machineRepository.save(machine));
    }

    @Transactional
    public MachineResponse updateMachine(Long id, UpdateMachineRequest request) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + id));

        String status = validateStatus(request.status());

        String serialNumber = request.serialNumber();
        if (serialNumber != null && !serialNumber.isBlank()) {
            machineRepository.findBySerialNumber(serialNumber.trim())
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new BusinessException("A machine with serial number '" + serialNumber + "' already exists");
                    });
            machine.setSerialNumber(serialNumber.trim());
        }

        machine.setName(request.name().trim());
        machine.setBrand(request.brand());
        machine.setModel(request.model());
        machine.setStatus(status);
        return toResponse(machineRepository.save(machine));
    }

    @Transactional(readOnly = true)
    public PageResponse<MachineResponse> getAllMachines(String status, String search, Pageable pageable) {
        String normalizedStatus = status == null || status.isBlank() ? null : validateStatus(status);
        return PageResponse.from(machineRepository.searchMachines(normalizedStatus,
                Pagination.normalizeSearch(search), pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public MachineResponse getMachineById(Long id) {
        return machineRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + id));
    }

    private String validateStatus(String status) {
        try {
            return MachineStatus.valueOf(status.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid machine status: " + status + ". Allowed: AVAILABLE, MAINTENANCE, OUT_OF_SERVICE");
        }
    }

    private MachineResponse toResponse(Machine machine) {
        return new MachineResponse(machine.getId(), machine.getName(), machine.getBrand(),
                machine.getModel(), machine.getSerialNumber(), machine.getStatus());
    }
}
