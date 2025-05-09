// Funkcja do wczytania danych JSON
async function fetchData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Błąd podczas wczytywania JSON:', error);
    return [];
  }
}

// Funkcja do utworzenia wykresu
async function createChart() {
  const chartContainer = document.getElementById('chart');
  
  // Tworzenie wykresu za pomocą Lightweight Charts
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

  // Wczytanie danych JSON
  const data = await fetchData();

  // Ustawienie danych na wykresie
  lineSeries.setData(data);

  // Automatyczne dopasowanie skali
  chart.timeScale().fitContent();

  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, 400);
  });
}

// Uruchomienie funkcji
createChart();
