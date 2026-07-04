import { Effect } from "effect"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { RubricService } from "../services/RubricService.js"

export const approveRubric = Effect.fnUntraced(function*(
  taskId: string,
  force = false,
) {
  const catalog = yield* BenchmarkCatalogService
  const rubrics = yield* RubricService
  const task = yield* catalog.getTask(taskId)
  const approved = yield* rubrics.approveDraft(task, force)
  return { taskId: task.id, ...approved }
})
