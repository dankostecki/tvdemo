// Funkcja do wczytania danych JSON
async function fetchData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }
    const data = await response.json();
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

// Funkcja do przeliczania danych na skalę procentową
function convertToPercentScale(data) {
  if (data.length === 0) return [];
  const baseValue = data[0].value; // Pierwsza wartość jako punkt odniesienia
  return data.map(item => ({
    time: item.time,
    value: ((item.value - baseValue) / baseValue) * 100 // Procentowa zmiana
  }));
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
    rightPriceScale: {
      mode: LightweightCharts.PriceScaleMode.Normal, // Domyślnie liniowa
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
  const rawData = await fetchData();
  if (rawData.length === 0) {
    document.getElementById('error').textContent = 'Brak danych do wyświetlenia';
    return;
  }

  // Flaga do przełączania skali
  let isPercentScale = false;

  // Funkcja do aktualizacji wykresu
  function updateChart() {
    const data = isPercentScale ? convertToPercentScale(rawData) : rawData;
    lineSeries.setData(data);
    chart.applyOptions({
      rightPriceScale: {
        mode: isPercentScale
          ? LightweightCharts.PriceScaleMode.Normal // Używamy normalnej skali, ale z wartościami procentowymi
          : LightweightCharts.PriceScaleMode.Normal,
        // Formatowanie osi Y dla skali procentowej
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });
    // Dodajemy formatowanie etykiet osi Y
    chart.priceScale('right').applyOptions({
      formatter: price => isPercentScale ? `${price.toFixed(2)}%` : price.toFixed(2),
    });
    chart.timeScale().fitContent();
  }

  // Ustawienie początkowych danych
  updateChart();

  // Obsługa przycisku przełączania skali
  const toggleButton = document.getElementById('toggleScale');
  toggleButton.addEventListener('click', () => {
    isPercentScale = !isPercentScale;
    toggleButton.textContent = `Zmień skalę (${isPercentScale ? 'Liniowa' : 'Procentowa'})`;
    updateChart();
  });

  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, 400);
  });
}

// Uruchomienie funkcji po załadowaniu strony
document.addEventListener('DOMContentLoaded', createChart);
