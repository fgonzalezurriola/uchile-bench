import { Layer } from "effect"
import { FileSystemService, FileSystemServiceLive } from "./FileSystemService.js"
import { HashService, HashServiceLive } from "./HashService.js"
import { EvidenceService, EvidenceServiceLive } from "./EvidenceService.js"
import { RunStoreService, RunStoreServiceLive } from "./RunStoreService.js"
import {
  BenchmarkCatalogService,
  BenchmarkCatalogServiceLive,
} from "./BenchmarkCatalogService.js"
import { AgentRegistryService, AgentRegistryServiceLive } from "./AgentRegistryService.js"
import { HostDiscoveryService, HostDiscoveryServiceLive } from "./HostDiscoveryService.js"
import { DockerService, DockerServiceLive } from "./DockerService.js"
import { SessionService, SessionServiceLive } from "./SessionService.js"
import { ProgressService, ProgressServiceLive } from "./ProgressService.js"
import { EnvironmentRegistryService, EnvironmentRegistryServiceLive } from "./EnvironmentRegistryService.js"
import {
  ExecutionEnvironmentService,
  ExecutionEnvironmentServiceLive,
} from "./ExecutionEnvironmentService.js"
import { AgentInvocationService, AgentInvocationServiceLive } from "./AgentInvocationService.js"
import { RubricService, RubricServiceLive } from "./RubricService.js"

/**
 * Build the full application layer with all dependencies resolved.
 *
 * Dependency graph:
 * - FileSystemService: no deps
 * - HashService: no deps
 * - DockerService: no deps
 * - HostDiscoveryService: no deps
 * - EvidenceService: depends on FileSystemService, HashService
 * - RunStoreService: depends on FileSystemService
 * - BenchmarkCatalogService: depends on FileSystemService
 * - AgentRegistryService: depends on FileSystemService
 * - SessionService: depends on FileSystemService
 * - ExecutionEnvironmentService: depends on EnvironmentRegistryService
 * - AgentInvocationService: depends on AgentRegistryService, DockerService,
 *   FileSystemService, HashService, and ExecutionEnvironmentService
 * - RubricService: depends on FileSystemService and HashService
 */

// Base layer: services with no dependencies
const BaseLayer = Layer.mergeAll(
  FileSystemServiceLive,
  HashServiceLive,
  DockerServiceLive,
  HostDiscoveryServiceLive,
)

// Provide base dependencies to each derived service
const EvidenceServiceFull = EvidenceServiceLive.pipe(Layer.provide(BaseLayer))
const RunStoreServiceFull = RunStoreServiceLive.pipe(Layer.provide(BaseLayer))
const BenchmarkCatalogServiceFull = BenchmarkCatalogServiceLive.pipe(
  Layer.provide(BaseLayer),
)
const AgentRegistryServiceFull = AgentRegistryServiceLive.pipe(Layer.provide(BaseLayer))
const SessionServiceFull = SessionServiceLive.pipe(Layer.provide(BaseLayer))

// ProgressService has no deps beyond base layer
const ProgressServiceFull = ProgressServiceLive.pipe(Layer.provide(BaseLayer))
const EnvironmentRegistryServiceFull = EnvironmentRegistryServiceLive.pipe(Layer.provide(BaseLayer))
const ExecutionEnvironmentServiceFull = ExecutionEnvironmentServiceLive.pipe(
  Layer.provide(EnvironmentRegistryServiceFull),
)
const AgentInvocationDependencies = Layer.mergeAll(
  BaseLayer,
  AgentRegistryServiceFull,
  ExecutionEnvironmentServiceFull,
)
const AgentInvocationServiceFull = AgentInvocationServiceLive.pipe(
  Layer.provide(AgentInvocationDependencies),
)
const RubricServiceFull = RubricServiceLive.pipe(Layer.provide(BaseLayer))

// Full app layer: merge everything
export const AppLayer = Layer.mergeAll(
  BaseLayer,
  EvidenceServiceFull,
  RunStoreServiceFull,
  BenchmarkCatalogServiceFull,
  AgentRegistryServiceFull,
  EnvironmentRegistryServiceFull,
  ExecutionEnvironmentServiceFull,
  SessionServiceFull,
  ProgressServiceFull,
  AgentInvocationServiceFull,
  RubricServiceFull,
)

// Re-export everything for convenience
export {
  FileSystemService,
  FileSystemServiceLive,
  HashService,
  HashServiceLive,
  EvidenceService,
  EvidenceServiceLive,
  RunStoreService,
  RunStoreServiceLive,
  BenchmarkCatalogService,
  BenchmarkCatalogServiceLive,
  AgentRegistryService,
  AgentRegistryServiceLive,
  HostDiscoveryService,
  HostDiscoveryServiceLive,
  DockerService,
  DockerServiceLive,
  SessionService,
  SessionServiceLive,
  ProgressService,
  ProgressServiceLive,
  EnvironmentRegistryService,
  EnvironmentRegistryServiceLive,
  ExecutionEnvironmentService,
  ExecutionEnvironmentServiceLive,
  AgentInvocationService,
  AgentInvocationServiceLive,
  RubricService,
  RubricServiceLive,
}
