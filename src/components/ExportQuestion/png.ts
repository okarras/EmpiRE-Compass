export async function chartsToPng(
  chartHtml: string,
  includeTitle = false,
  mainChartsOnly = false
) {
  const container = document.createElement('div');
  container.innerHTML = chartHtml;
  const figures = container.querySelectorAll(
    `figure.report-chart${mainChartsOnly ? ':not([data-chart-kind="detail"])' : ''}`
  );

  if (!figures.length) {
    throw new Error('No charts available for export.');
  }

  const images = [];

  for (const figure of figures) {
    const svg = figure.querySelector('svg');
    if (!svg) throw new Error('Chart SVG is missing.');

    const content = new XMLSerializer().serializeToString(svg);
    const imageSrc =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Chart dimensions are missing.');
    }

    const title = figure.querySelector('h3')?.textContent?.trim() ?? '';
    const headingHeight = includeTitle && title ? 48 : 0;

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * 2;
    canvas.height = (image.naturalHeight + headingHeight) * 2;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (headingHeight) {
      context.fillStyle = '#222';
      context.font = 'bold 36px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(
        title,
        canvas.width / 2,
        headingHeight,
        canvas.width - 48
      );
    }

    context.drawImage(
      image,
      0,
      headingHeight * 2,
      image.naturalWidth * 2,
      image.naturalHeight * 2
    );

    images.push({
      title,
      display: figure.getAttribute('data-chart-display'),
      dataUrl: canvas.toDataURL('image/png'),
      width: image.naturalWidth,
      height: image.naturalHeight + headingHeight,
    });
    // Release the large bitmap immediately and let the browser handle input/paint.
    canvas.width = 0;
    canvas.height = 0;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return images;
}
