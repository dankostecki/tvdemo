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
  const baseValue = data[0].value; // Pierwsza wartość w wybranym zakresie
  return data.map(item => ({
    time: item.time,
    value: ((item.value - baseValue) / baseValue) * 100 // Procentowa zmiana
  }));
}

// Funkcja do filtrowania danych według zakresu
function filterDataByRange(data, range) {
  if (range === 'all') return data;

  if (data.length === 0) return [];

  // Sortowanie danych chronologicznie (na wszelki wypadek)
  const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));

  // Pobranie daty ostatniego punktu
  const latestDate = new Date(sortedData[sortedData.length - 1].time);
  let monthsBack;

  if (range === 'quarter') {
    monthsBack = 3; // Ostatnie 3 miesiące
  } else if (range === 'year') {
    monthsBack = 12; // Ostatnie 12 miesięcy
  } else {
    return sortedData; // Zabezpieczenie
  }

  // Obliczenie daty odcięcia
  const cutoffDate = new Date(latestDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack + 1); // +1, aby uwzględnić cały miesiąc
  cutoffDate.setDate(1); // Ustawienie na początek miesiąca

  // Filtrowanie danych
  const filteredData = sortedData.filter(item => {
    const itemDate = new Date(item.time);
    return itemDate >= cutoffDate;
  });

  // Diagnostyka
  console.log(`Zakres: ${range}`);
  console.log(`Data odcięcia: ${cutoffDate.toISOString().split('T')[0]}`);
  console.log(`Liczba punktów po filtrowaniu: ${filteredData.length}`);
  console.log('Przefiltrowane dane:', filteredData);

  return filteredData;
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
      mode: LightweightCharts.PriceScaleMode.Normal,
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

  // Flagi i stan
  let isPercentScale = false;
  let currentRange = 'all'; // Domyślnie wszystkie dane

  // Funkcja do aktualizacji wykresu
  function updateChart() {
    // Filtrowanie danych według zakresu
    let filteredData = filterDataByRange(rawData, currentRange);
    if (filteredData.length === 0) {
      document.getElementById('error').textContent = `Brak danych dla zakresu: ${currentRange}`;
      lineSeries.setData([]);
      return;
    } else {
      document.getElementById('error').textContent = '';
    }

    // Przeliczenie na skalę procentową, jeśli wybrano
    const data = isPercentScale ? convertToPercentScale(filteredData) : filteredData;
    
    lineSeries.setData(data);
    chart.applyOptions({
      rightPriceScale: {
        mode: LightweightCharts.PriceScaleMode.Normal,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });
    // Formatowanie osi Y
    chart.priceScale('right').applyOptions({
      formatter: price => isPercentScale ? `${price.toFixed(2)}%` : price.toFixed(2),
    });
    chart.timeScale().fitContent();
  }

  // Ustawienie początkowych danych
  updateChart();

  // Obsługa przycisku zmiany skali
  const toggleScaleButton = document.getElementById('toggleScale');
  toggleScaleButton.addEventListener('click', () => {
    isPercentScale = !isPercentScale;
    toggleScaleButton.textContent = `Zmień skalę (${isPercentScale ? 'Liniowa' : 'Procentowa'})`;
    updateChart();
  });

  // Obsługa przycisków zakresu danych
  const rangeButtons = {
    all: document.getElementById('allData'),
    quarter: document.getElementById('lastQuarter'),
    year: document.getElementById('lastYear'),
  };

  function setActiveButton(range) {
    Object.keys(rangeButtons).forEach(key => {
      rangeButtons[key].classList.toggle('active', key === range);
    });
  }

  rangeButtons.all.addEventListener('click', () => {
    currentRange = 'all';
    setActiveButton('all');
    updateChart();
  });

  rangeButtons.quarter.addEventListener('click', () => {
    currentRange = 'quarter';
    setActiveButton('quarter');
    updateChart();
  });

  rangeButtons.year.addEventListener('click', () => {
    currentRange = 'year';
    setActiveButton('year');
    updateChart();
  });

  // Ustawienie domyślnego aktywnego przycisku
  setActiveButton('all');

  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, 400);
  });
}

// Uruchomienie funkcji po załadowaniu strony
document.addEventListener('DOMContentLoaded', createChart);
