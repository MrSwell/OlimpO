package server.olimpo.unit;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Placeholder to validate the test toolchain (JUnit 5 + Mockito) before real suites. */
class SmokeTest {

    @Test
    void toolchainWorks() {
        Runnable mock = Mockito.mock(Runnable.class);
        mock.run();
        Mockito.verify(mock).run();
        assertTrue(true);
    }
}