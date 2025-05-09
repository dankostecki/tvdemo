// Funkcja do wczytania danych JSON
async function fetchData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }
    const data = await response.json();
    // Sprawdzenie formatu danych
    if (!Array.isArray(data) || !data.every(item => 'time' in item && 'value' in item)) {
      throw new Error('Nieprawidłowy format danych JSON');
    }
    return data;
  } catch (error) {
    document.getElementById('error').textContent = `Błąd wczytywania danych: ${error.message}`;
    console.error('Błąd:', error);
    return [];
  }
}

// Funkcja do utworzenia wykresu
async function createChart() {
  const chartContainer = document.getElementById('chart');
  if (!chartContainer) {
    document.getElementById('error').textContent = 'Kontener wykresu nie znaleziony';
    return;
  }

  // Tworzenie wykresu
  const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: 400,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#f0f0f0' },
      horLines: { color: '#f0f0f0' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  });

  // Dodanie serii liniowej
  const lineSeries = chart.addLineSeries({
    color: '#2962FF',
    lineWidth: 2,
  });

  // Wczytanie danych
  const data = await fetchData();
  if (data.length === 0) {
    document.getElementById('error').textContent = 'Brak danych do wyświetlenia';
    return;
  }

  // Ustawienie danych na wykresie
  lineSeries.setData(data);

  // Dopasowanie skali
  chart.timeScale().fitContent();

  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, 400);
  });
}

// Uruchomienie funkcji po załadowaniu strony
document.addEventListener('DOMContentLoaded', createChart);
