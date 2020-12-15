import minimatch from 'minimatch';

const GLOB_OPTIONS = { dot: true };

export const glob = (str: string, globPattern: string): boolean => {
  return minimatch(str, globPattern, GLOB_OPTIONS);
};

export const globSeq = (seq: any[], globPattern: string): any[] => {
  return seq.filter((path: string) => minimatch(path, globPattern, GLOB_OPTIONS));
};

// export const captureGlobPaths = (
//   fs: Map<any, any>,
//   globPattern: string,
//   filterCondition = (path: any) => true
// ): any => {
//   return [...fs.entries()].reduce((captures: any[], path: any) => {
//     if (filterCondition(path)) {
//       const pathCaptures = capture(path, globPattern, GLOB_OPTIONS);

//       if (pathCaptures) {
//         return captures.concat(pathCaptures);
//       }
//     }

//     return captures;
//   }, []);
// };
