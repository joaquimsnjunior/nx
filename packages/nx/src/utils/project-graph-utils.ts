import { buildTargetFromScript, PackageJson } from './package-json';
import { join, relative } from 'path';
import { ProjectGraph, ProjectGraphProjectNode } from '../config/project-graph';
import { readJsonFile } from './fileutils';
import { normalizePath } from './path';
import { readCachedProjectGraph } from '../project-graph/project-graph';
import { TargetConfiguration } from '../config/workspace-json-project-json';

export function projectHasTarget(
  project: ProjectGraphProjectNode,
  target: string
) {
  return project.data && project.data.targets && project.data.targets[target];
}

export function projectHasTargetAndConfiguration(
  project: ProjectGraphProjectNode,
  target: string,
  configuration: string
) {
  return (
    projectHasTarget(project, target) &&
    project.data.targets[target].configurations &&
    project.data.targets[target].configurations[configuration]
  );
}

export function mergeNpmScriptsWithTargets(
  projectRoot: string,
  targets
): Record<string, TargetConfiguration> {
  try {
    const { scripts, nx }: PackageJson = readJsonFile(
      join(projectRoot, 'package.json')
    );
    const res: Record<string, TargetConfiguration> = {};
    // handle no scripts
    Object.keys(scripts || {}).forEach((script) => {
      res[script] = buildTargetFromScript(script, nx);
    });
    return { ...res, ...(targets || {}) };
  } catch (e) {
    return targets;
  }
}

export function getSourceDirOfDependentProjects(
  projectName: string,
  projectGraph = readCachedProjectGraph()
): string[] {
  if (!projectGraph.nodes[projectName]) {
    throw new Error(
      `Couldn't find project "${projectName}" in this Nx workspace`
    );
  }

  const nodeNames = findAllProjectNodeDependencies(projectName, projectGraph);
  return nodeNames.map(
    (nodeName) => projectGraph.nodes[nodeName].data.sourceRoot
  );
}

/**
 * Finds the project node name by a file that lives within it's src root
 * @param projRelativeDirPath directory path relative to the workspace root
 * @param projectGraph
 */
export function getProjectNameFromDirPath(
  projRelativeDirPath: string,
  projectGraph = readCachedProjectGraph()
) {
  let parentNodeName = null;
  for (const [nodeName, node] of Object.entries(projectGraph.nodes)) {
    const normalizedRootPath = normalizePath(node.data.root);
    const normalizedProjRelPath = normalizePath(projRelativeDirPath);

    const relativePath = relative(normalizedRootPath, normalizedProjRelPath);
    const isMatch = relativePath && !relativePath.startsWith('..');

    if (isMatch || normalizedRootPath === normalizedProjRelPath) {
      parentNodeName = nodeName;
      break;
    }
  }

  if (!parentNodeName) {
    throw new Error(
      `Could not find any project containing the file "${projRelativeDirPath}" among it's project files`
    );
  }

  return parentNodeName;
}

/**
 * Find all internal project dependencies.
 * All the external (npm) dependencies will be filtered out
 * @param {string} parentNodeName
 * @param {ProjectGraph} projectGraph
 * @returns {string[]}
 */
function findAllProjectNodeDependencies(
  parentNodeName: string,
  projectGraph = readCachedProjectGraph()
): string[] {
  const dependencyNodeNames = new Set<string>();

  collectDependentProjectNodesNames(
    projectGraph as ProjectGraph,
    dependencyNodeNames,
    parentNodeName
  );

  return Array.from(dependencyNodeNames);
}

// Recursively get all the dependencies of the node
function collectDependentProjectNodesNames(
  nxDeps: ProjectGraph,
  dependencyNodeNames: Set<string>,
  parentNodeName: string
) {
  const dependencies = nxDeps.dependencies[parentNodeName];
  if (!dependencies) {
    // no dependencies for the given node, so silently return,
    // as we probably wouldn't want to throw here
    return;
  }

  for (const dependency of dependencies) {
    const dependencyName = dependency.target;

    // we're only intersted in project dependencies, not npm
    if (dependencyName.startsWith('npm:')) {
      continue;
    }

    dependencyNodeNames.add(dependencyName);

    // Get the dependencies of the dependencies
    collectDependentProjectNodesNames(
      nxDeps,
      dependencyNodeNames,
      dependencyName
    );
  }
}
