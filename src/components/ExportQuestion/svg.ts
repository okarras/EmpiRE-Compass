export function serializeChartSvg(svg: SVGSVGElement): string {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const originals = [svg, ...svg.querySelectorAll('*')];
  const copies = [copy, ...copy.querySelectorAll('*')];

  originals.forEach((element, index) => {
    const style = (
      element.ownerDocument.defaultView ?? window
    ).getComputedStyle(element);
    const target = copies[index] as SVGElement;

    if (element.localName === 'rect') {
      ['x', 'y', 'width', 'height'].forEach((property) => {
        const value = Number.parseFloat(style.getPropertyValue(property));

        if (Number.isFinite(value)) {
          target.setAttribute(property, String(value));
          target.style.removeProperty(property);
        }
      });
    }

    if (element !== svg && style.transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(style.transform);

      // Chart transforms are planar, even when the browser reports matrix3d.
      // Standalone SVG images need the equivalent SVG matrix attribute.
      target.setAttribute(
        'transform',
        `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`
      );
      target.style.removeProperty('transform');
    }

    [
      'fill',
      'stroke',
      'font-size',
      'font-family',
      'font-weight',
      'text-anchor',
      'dominant-baseline',
      'pointer-events',
    ].forEach((property) => {
      target.style.setProperty(property, style.getPropertyValue(property));
    });

    // Collection charts inherit pointer-events: none from their hidden container.
    // Exported bars must remain interactive for hover styles and SVG titles.
    if (element.classList.contains('MuiBarElement-root')) {
      target.style.setProperty('pointer-events', 'auto');
    }
  });

  const hoverStyle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'style'
  );

  hoverStyle.textContent = `
.MuiBarElement-root {
  transition: filter 150ms ease;
}

.MuiBarElement-root:hover {
  filter: brightness(0.75);
}
`;

  copy.prepend(hoverStyle);

  copy.removeAttribute('xmlns');
  copy.setAttributeNS(
    'http://www.w3.org/2000/xmlns/',
    'xmlns',
    'http://www.w3.org/2000/svg'
  );

  return new XMLSerializer().serializeToString(copy);
}

export function buildSvgChartFigure(svg: SVGSVGElement, title: string) {
  const figure = document.createElement('figure');
  figure.className = 'report-chart';
  const heading = document.createElement('h3');
  heading.textContent = title;
  figure.append(heading);
  figure.insertAdjacentHTML('beforeend', serializeChartSvg(svg));
  const copy = figure.querySelector('svg')!;
  const { width, height } = svg.getBoundingClientRect();
  copy.setAttribute('width', String(width));
  copy.setAttribute('height', String(height));
  return figure;
}

export function serializeSvgChartFile(figure: Element): string {
  const svg = figure.querySelector('svg');
  if (!svg) throw new Error('Chart SVG is missing.');
  const namespace = 'http://www.w3.org/2000/svg';
  const heading = figure.querySelector('h3')?.textContent?.trim() ?? '';
  const width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
  const height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
  const padding = 24;
  const headingHeight = heading ? 40 : 0;

  const exportSvg = document.createElementNS(namespace, 'svg');
  exportSvg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', namespace);
  exportSvg.setAttribute('width', String(width + padding * 2));
  exportSvg.setAttribute(
    'height',
    String(height + headingHeight + padding * 2)
  );
  exportSvg.setAttribute(
    'viewBox',
    `0 0 ${width + padding * 2} ${height + headingHeight + padding * 2}`
  );
  exportSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  exportSvg.style.width = '100vw';
  exportSvg.style.height = '100vh';
  exportSvg.style.display = 'block';

  if (heading) {
    const title = document.createElementNS(namespace, 'text');
    title.setAttribute('x', String(width / 2 + padding));
    title.setAttribute('y', String(padding + 20));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-family', 'Arial, sans-serif');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#222');
    title.textContent = heading;
    exportSvg.append(title);
  }

  svg.setAttribute('x', String(padding));
  svg.setAttribute('y', String(padding + headingHeight));
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  exportSvg.append(svg);

  return new XMLSerializer().serializeToString(exportSvg);
}
