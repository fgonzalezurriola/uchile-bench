import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import path from "node:path"

interface SourceSpec {
  readonly absolutePath: string
  readonly destinationName?: string
}

interface TaskSpec {
  readonly catalog: "standalone" | "cumulative"
  readonly course: string
  readonly key: string
  readonly title: string
  readonly description: string
  readonly sources: ReadonlyArray<SourceSpec>
  readonly starterProvided: boolean
  readonly maxMinutes?: number
  readonly gradingSeed?: string
  readonly publicGuide?: string
}

const benchRoot = process.cwd()
const repoRoot = path.resolve(benchRoot, "..")
const tasksRoot = path.join(benchRoot, "tasks")

const hashFile = (filePath: string): string =>
  createHash("sha256").update(readFileSync(filePath)).digest("hex")

const ensureParent = (filePath: string): void => {
  mkdirSync(path.dirname(filePath), { recursive: true })
}

const copyExact = (source: string, destination: string): void => {
  const metadata = statSync(source)
  ensureParent(destination)
  copyFileSync(source, destination)
  chmodSync(destination, metadata.mode)
  utimesSync(destination, metadata.atime, metadata.mtime)
}

const source = (relativePath: string, destinationName?: string): SourceSpec => ({
  absolutePath: path.join(repoRoot, relativePath),
  ...(destinationName === undefined ? {} : { destinationName }),
})

const listSourceFiles = (
  spec: SourceSpec,
): ReadonlyArray<{ readonly file: string; readonly relativePath: string }> => {
  const metadata = statSync(spec.absolutePath)
  if (metadata.isFile()) {
    return [
      {
        file: spec.absolutePath,
        relativePath: spec.destinationName ?? path.basename(spec.absolutePath),
      },
    ]
  }

  const files: Array<{ readonly file: string; readonly relativePath: string }> = []
  const visit = (directory: string, relativeDirectory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const absoluteEntry = path.join(directory, entry.name)
      const relativeEntry = path.join(relativeDirectory, entry.name)
      if (entry.isDirectory()) visit(absoluteEntry, relativeEntry)
      else {
        files.push({
          file: absoluteEntry,
          relativePath:
            spec.destinationName === undefined
              ? relativeEntry
              : path.join(spec.destinationName, relativeEntry),
        })
      }
    }
  }
  visit(spec.absolutePath, "")
  return files
}

const publicRelativePath = (relativePath: string): string => {
  const extension = path.extname(relativePath).toLowerCase()
  return extension === ".pdf" || extension === ".txt"
    ? `${relativePath.slice(0, -extension.length)}.md`
    : relativePath
}

const copyToPublic = (sourceFile: string, relativePath: string, publicRoot: string): void => {
  const extension = path.extname(sourceFile).toLowerCase()
  const destination = path.join(publicRoot, publicRelativePath(relativePath))
  if (extension === ".pdf") {
    const markdown = execFileSync("markitdown", [sourceFile], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    })
    ensureParent(destination)
    writeFileSync(destination, markdown, "utf8")
    return
  }
  copyExact(sourceFile, destination)
}

const mergeDirectory = (sourceDirectory: string, destinationDirectory: string): void => {
  if (!existsSync(sourceDirectory)) return
  mkdirSync(destinationDirectory, { recursive: true })
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourceEntry = path.join(sourceDirectory, entry.name)
    const destinationEntry = path.join(destinationDirectory, entry.name)
    if (entry.isDirectory()) mergeDirectory(sourceEntry, destinationEntry)
    else copyExact(sourceEntry, destinationEntry)
  }
}

const hasMarkdown = (directory: string): boolean =>
  readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return hasMarkdown(entryPath)
    return [".md", ".markdown"].includes(path.extname(entry.name).toLowerCase())
  })

const createTask = (task: TaskSpec): void => {
  const taskRoot = path.join(tasksRoot, task.catalog, task.course, task.key)
  const originalRoot = path.join(taskRoot, "original")
  const publicRoot = path.join(taskRoot, "public")
  const gradingRoot = path.join(taskRoot, "grading")
  mkdirSync(originalRoot, { recursive: true })
  mkdirSync(publicRoot, { recursive: true })
  mkdirSync(gradingRoot, { recursive: true })

  writeFileSync(
    path.join(taskRoot, "task.json"),
    `${JSON.stringify(
      {
        title: task.title,
        description: task.description,
        evaluation: "manual",
        ...(task.maxMinutes === undefined ? {} : { maxMinutes: task.maxMinutes }),
        notes: {
          languageSpecified: true,
          starterProvided: task.starterProvided,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  )

  const provenance: Array<{
    readonly source: string
    readonly destination: string
    readonly hash: string
  }> = []

  for (const sourceSpec of task.sources) {
    for (const entry of listSourceFiles(sourceSpec)) {
      const originalDestination = path.join(originalRoot, entry.relativePath)
      copyExact(entry.file, originalDestination)
      copyToPublic(entry.file, entry.relativePath, publicRoot)
      provenance.push({
        source: path.relative(repoRoot, entry.file),
        destination: entry.relativePath.split(path.sep).join("/"),
        hash: hashFile(entry.file),
      })

      const extension = path.extname(entry.file).toLowerCase()
      if (extension !== ".pdf" && extension !== ".txt") {
        const publicDestination = path.join(publicRoot, entry.relativePath)
        if (hashFile(originalDestination) !== hashFile(publicDestination)) {
          throw new Error(`Hash mismatch for ${entry.file}`)
        }
      }
    }
  }

  if (task.publicGuide !== undefined && existsSync(task.publicGuide)) {
    copyExact(task.publicGuide, path.join(publicRoot, "INSTRUCTIONS.md"))
  }
  if (!hasMarkdown(publicRoot)) {
    writeFileSync(
      path.join(publicRoot, "INSTRUCTIONS.md"),
      "# Material original\n\nEl enunciado y código inicial están contenidos en los archivos copiados a este directorio.\n",
      "utf8",
    )
  }

  if (task.gradingSeed !== undefined) mergeDirectory(task.gradingSeed, gradingRoot)
  if (readdirSync(gradingRoot).length === 0) {
    writeFileSync(
      path.join(gradingRoot, "rubric.md"),
      "# Pauta de evaluación\n\nPendiente de revisión y adaptación manual desde el enunciado original.\n",
      "utf8",
    )
  }

  writeFileSync(
    path.join(originalRoot, "PROVENANCE.md"),
    [
      "# Provenance",
      "",
      "| Fuente | Ruta en original | SHA-256 |",
      "| --- | --- | --- |",
      ...provenance.map(
        (entry) =>
          `| \`${entry.source}\` | \`${entry.destination}\` | \`${entry.hash}\` |`,
      ),
      "",
      "Los PDF se convirtieron a Markdown con `markitdown`. Los TXT se copiaron byte a byte con extensión `.md`. El resto de los archivos se copió sin cambios a `public/`.",
      "",
    ].join("\n"),
    "utf8",
  )
}

const tasks: TaskSpec[] = []

const cc3001Descriptions = [
  "Resolver la tarea de pilas de arena abelianas en Python.",
  "Implementar una calculadora de expresiones restringidas en Python.",
  "Resolver Sudoku usando backtracking en Python.",
  "Generar código para evaluar fórmulas representadas como árboles.",
  "Implementar árboles binarios de búsqueda posicionales en Python.",
  "Comparar Quicksort original con la variante mediana de tres.",
]
for (const [offset, description] of cc3001Descriptions.entries()) {
  const number = offset + 1
  tasks.push({
    catalog: "standalone",
    course: "CC3001",
    key: `t${String(number).padStart(2, "0")}`,
    title: `CC3001 Tarea ${number}`,
    description,
    sources: [source(`CC3001/CC3001_otoño_2023_tarea${number}.py`)],
    starterProvided: true,
    gradingSeed: path.join(tasksRoot, "CC3001", `t${number}`, "grading"),
    publicGuide: path.join(tasksRoot, "CC3001", `t${number}`, "public", "INSTRUCTIONS.md"),
  })
}

const cc3301 = new Map<number, string>([
  [1, "Eliminar cifras hexadecimales de un entero de 64 bits usando operaciones de bits en C."],
  [2, "Procesar palabras en strings mediante aritmética de punteros y memoria dinámica en C."],
  [3, "Eliminar eficientemente un rango de una lista enlazada ordenada en C."],
  [4, "Consultar eficientemente un diccionario persistente almacenado como árbol binario en disco."],
  [5, "Modificar un algoritmo de ordenamiento en C y assembler RISC-V para ignorar mayúsculas."],
  [7, "Resolver suma de subconjuntos en paralelo usando procesos y pipes."],
  [8, "Listar recursivamente los archivos modificados más recientemente."],
])
for (const [number, description] of cc3301) {
  tasks.push({
    catalog: "standalone",
    course: "CC3301",
    key: `t${String(number).padStart(2, "0")}`,
    title: `CC3301 Tarea ${number}`,
    description,
    sources: [source(`CC3301/t${number}`)],
    starterProvided: true,
  })
}

for (const [number, description] of [
  [1, "Crear el diseño visual e interacción básica de un pinball 3D."],
  [2, "Extender el pinball anterior con apariencia, simulación física e iluminación."],
] as const) {
  tasks.push({
    catalog: "cumulative",
    course: "CC3501",
    key: `t0${number}`,
    title: `CC3501 Tarea ${number}`,
    description,
    sources: [source(`CC3501/CC3501-otoño-2024-tarea${number}.pdf`)],
    starterProvided: false,
    maxMinutes: 360,
    gradingSeed: path.join(tasksRoot, "CC3501", `t${number}`, "grading"),
  })
}
tasks.push({
  catalog: "cumulative",
  course: "CC3501",
  key: "t03",
  title: "CC3501 Tarea 3",
  description: "Crear una demostración gráfica relacionada con la materia del curso.",
  sources: [source("CC3501/CC3501-otoño-2024-tarea3.pdf")],
  starterProvided: false,
  maxMinutes: 360,
  gradingSeed: path.join(tasksRoot, "CC3501", "t3", "grading"),
})

const cc4101Descriptions = [
  "Implementar operaciones sobre proposiciones y forma normal disyuntiva en Racket.",
  "Implementar lenguajes e intérpretes para polinomios y números complejos en Racket.",
  "Implementar chequeo de tipos, interpretación y pattern matching en Racket.",
]
for (const [offset, description] of cc4101Descriptions.entries()) {
  const number = offset + 1
  tasks.push({
    catalog: "standalone",
    course: "CC4101",
    key: `t0${number}`,
    title: `CC4101 Tarea ${number}`,
    description,
    sources: [source(`CC4101/t${number}`)],
    starterProvided: true,
  })
}

for (const [number, description] of [
  [1, "Implementar y comparar Mergesort externo y Quicksort externo."],
  [2, "Implementar y comparar variantes del algoritmo de Kruskal."],
] as const) {
  tasks.push({
    catalog: "standalone",
    course: "CC4102",
    key: `t0${number}`,
    title: `CC4102 Tarea ${number}`,
    description,
    sources: [source(`CC4102/t${number}.pdf`)],
    starterProvided: false,
    maxMinutes: 360,
  })
}

const cc4302Descriptions = [
  "Sincronizar la evaluación paralela de una fórmula booleana.",
  "Implementar acceso sincronizado a un disco compartido.",
  "Implementar un lock de lectores y escritores.",
  "Implementar una subasta multithreaded usando primitivas internas de nThreads sin timeout.",
  "Implementar una subasta multithreaded con timeout y nuevas ofertas.",
  "Implementar postulaciones concurrentes usando spinlocks.",
  "Implementar productor-consumidor y mutex en un módulo de kernel.",
]
for (const [offset, description] of cc4302Descriptions.entries()) {
  const number = offset + 1
  tasks.push({
    catalog: "standalone",
    course: "CC4302",
    key: `t0${number}`,
    title: `CC4302 Tarea ${number}`,
    description,
    sources: [
      source(`CC4302/t${number}`),
      ...(number === 5
        ? [
            source(
              "CC4302/t4/CC4302_otoño_2025_tarea4.pdf",
              "CC4302_otoño_2025_tareas4_y_5.pdf",
            ),
          ]
        : []),
    ],
    starterProvided: true,
    maxMinutes: 240,
  })
}

for (const task of tasks) createTask(task)

console.log(`Imported ${tasks.length} task manifests without deleting source material.`)
