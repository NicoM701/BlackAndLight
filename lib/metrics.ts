export type BinaryImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type TransformMetrics = {
  whiteRatio: number;
  componentCount: number;
  meanComponentArea: number;
  maxComponentArea: number;
  edgeAlignmentScore: number;
  fallbackSegmentation: boolean;
  tunedIterations: number;
};

export function computeBinaryStats(image: BinaryImage) {
  const total = image.width * image.height;
  let white = 0;
  for (let i = 0; i < total; i += 1) {
    white += image.data[i] ? 1 : 0;
  }

  return {
    whiteRatio: total > 0 ? white / total : 0
  };
}

export function connectedComponents(image: BinaryImage) {
  const { width, height, data } = image;
  const visited = new Uint8Array(width * height);
  const areas: number[] = [];

  const offsets = [-1, 1, -width, width];

  for (let idx = 0; idx < data.length; idx += 1) {
    if (data[idx] === 0 || visited[idx]) {
      continue;
    }
    let area = 0;
    const stack = [idx];
    visited[idx] = 1;

    while (stack.length > 0) {
      const cur = stack.pop() as number;
      area += 1;

      const x = cur % width;
      const y = Math.floor(cur / width);

      for (const off of offsets) {
        const next = cur + off;
        if (next < 0 || next >= data.length) {
          continue;
        }

        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) {
          continue;
        }

        if (!visited[next] && data[next] === 1) {
          visited[next] = 1;
          stack.push(next);
        }
      }
    }

    areas.push(area);
  }

  const totalArea = areas.reduce((acc, cur) => acc + cur, 0);

  return {
    count: areas.length,
    meanArea: areas.length ? totalArea / areas.length : 0,
    maxArea: areas.length ? Math.max(...areas) : 0,
    areas
  };
}

export function edgeAlignment(binary: BinaryImage, edgeMap: Float32Array) {
  let white = 0;
  let aligned = 0;

  for (let i = 0; i < binary.data.length; i += 1) {
    if (binary.data[i] === 1) {
      white += 1;
      aligned += edgeMap[i] > 0.2 ? 1 : 0;
    }
  }

  return white ? aligned / white : 0;
}
