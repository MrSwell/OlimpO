package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import server.olimpo.dto.request.CreateMachineRequest;
import server.olimpo.dto.request.UpdateMachineRequest;
import server.olimpo.dto.response.MachineResponse;
import server.olimpo.entity.Machine;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.MachineRepository;
import server.olimpo.service.MachineService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineServiceTest {

    @Mock
    private MachineRepository machineRepository;

    private MachineService service() {
        return new MachineService(machineRepository);
    }

    @Test
    @DisplayName("S4: creating a machine defaults status AVAILABLE")
    void createDefaultsToAvailable() {
        when(machineRepository.existsBySerialNumber("NT-X1-9")).thenReturn(false);
        when(machineRepository.save(any(Machine.class))).thenAnswer(inv -> {
            Machine m = inv.getArgument(0);
            m.setId(3L);
            return m;
        });

        MachineResponse response = service().createMachine(
                new CreateMachineRequest("Smith machine", "NordicTrack", "X9", "NT-X1-9", null));

        assertEquals(3L, response.id());
        assertEquals("AVAILABLE", response.status());
        assertEquals("NT-X1-9", response.serialNumber());
    }

    @Test
    @DisplayName("S4: duplicated serial number -> 409")
    void duplicateSerialRejected() {
        when(machineRepository.existsBySerialNumber("NT-X1-9")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().createMachine(
                        new CreateMachineRequest("Smith machine", "NordicTrack", "X9", "NT-X1-9", null)));

        assertTrue(ex.getMessage().contains("already exists"));
        verify(machineRepository, never()).save(any());
    }

    @Test
    @DisplayName("S4: invalid status -> 400 with allowed list")
    void invalidStatusRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createMachine(
                        new CreateMachineRequest("Bici", "Life", "L1", null, "ROTA")));

        assertTrue(ex.getMessage().contains("AVAILABLE, MAINTENANCE, OUT_OF_SERVICE"));
        verify(machineRepository, never()).save(any());
    }

    @Test
    @DisplayName("S4: update machine status to MAINTENANCE")
    void updateStatus() {
        Machine machine = Machine.builder().id(1L).name("Bici").status("AVAILABLE").build();
        when(machineRepository.findById(1L)).thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenAnswer(inv -> inv.getArgument(0));

        MachineResponse response = service().updateMachine(1L,
                new UpdateMachineRequest("Bici spinning", "Life", "L1", null, "MAINTENANCE"));

        assertEquals("MAINTENANCE", response.status());
        assertEquals("Bici spinning", response.name());
    }

    @Test
    @DisplayName("S4: update with a serial owned by another machine -> 409")
    void updateSerialConflict() {
        Machine machine = Machine.builder().id(1L).name("Bici").status("AVAILABLE").build();
        Machine other = Machine.builder().id(2L).serialNumber("NT-X1-9").build();
        when(machineRepository.findById(1L)).thenReturn(Optional.of(machine));
        when(machineRepository.findBySerialNumber("NT-X1-9")).thenReturn(Optional.of(other));

        assertThrows(BusinessException.class, () -> service().updateMachine(1L,
                new UpdateMachineRequest("Bici", "Life", "L1", "NT-X1-9", "AVAILABLE")));
        verify(machineRepository, never()).save(any());
    }

    @Test
    @DisplayName("S4: unknown machine -> 404")
    void unknownMachine() {
        when(machineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getMachineById(99L));
    }

    @Test
    @DisplayName("S4: invalid filter status -> 400")
    void invalidFilterStatus() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().getAllMachines("ROTA", null, org.springframework.data.domain.PageRequest.of(0, 10)));
        assertTrue(ex.getMessage().contains("Invalid machine status"));
    }
}