# Alba server developer guide

## Architecture

The project uses a 2-dimensional module structure, where the top-level modules are context-based, and the submodules are a simplification of the modules often used in Domain-driven Design.

### Context modules

The top-level _context_ modules represent logic components and constitutes bounded contexts, e.g. Rundown Execution, Action System, iNews Ingest and Asset Management.
The context modules at the moment are:

```mermaid
graph TD

rundownExecution[["
  Rundown Execution
  [Context Module]

  Manages rundown state.
"]]

rundownIngest[["
  Rundown Ingest
  [Context Module]

  Handles rundown ingest workflow independent
  of which ingest gateway is used.
"]]

tv2InewsIngest[["
  TV 2 iNews Ingest
  [Context Module]

  Manages iNews Gateway connections and mapping
  TV 2-specific iNews syntax into Albas ingest-format.
"]]

sofieIngest[["
  Sofie Ingest
  [[Context Module]]

  Manages integration to the Sofie database.
  It is isolated as these will be phased out step-by-step.
"]]

blueprints[["
  Blueprints
  [[Context Module]]

  Manages rundown creation from external data.  
"]]

actionSystem["
  Action System
  [Context Module]

  Manages applicable user actions.
"]

crossCuttingConcerns[["
  Cross-cutting Concerns
  [Context Module]

  Holds shared logic and types that are used by almost all other modules. 
"]]

tv2InewsIngest --> |"provides rundown ingest changes to"| rundownIngest
rundownIngest -.-> |"synchronizes rundown changes to"| rundownExecution
sofieIngest --> |"synchronizes sofie changes to"| rundownExecution
sofieIngest --> |"transforms Sofie data to Alba data with"| blueprints
rundownIngest -.-> |"builds rundown data with"| blueprints
actionSystem --> |"runs user actions against"| rundownExecution
```

### Submodules

The Domain-driven Design-based submodules are:

```mermaid
graph TD


domain["
  Domain
  [Submodule]

  Contains domain rules and logic.
"]

application["
  Application
  [Submodule]

  Contains use case logic.
"]

infrastructure["
  Infrastructure
  [Submodule]

  Technical capability and framework integrations.
"]

application --> |"may depend on"| domain
infrastructure --> |"may depend on interfaces from"| domain
infrastructure --> |"may depend on interfaces from"| application
```

**Domain**

The domain submodule contains structures like:

- Entities
- Value objects
- Aggregates
- Domain services
- Domain events
- Repository interfaces

**Application**

The application submodule contains structures like:

- Use case services
- DTOs and DTO mappers
- Port interfaces (e.g. HttpServer, EmailSender)
- Controllers
- Input validation


**Infrastructure**

The infrastructure submodule contains structures like:

- Repository implementations.
- External service integrations (HttpServer, MailSender, HttpRequestService, Database, Logging).
- Application configuration management.

### Module interaction

_Contracts_ in the following table is used as a term for exposed structures, which can be interfaces, facades, services or the like.
Intra-module dependencies:

| From \ To          | Domain     | Application | Infrastructure |
|:-------------------|:-----------|:------------|:---------------|
| **Domain**         | Everything |             |                |
| **Application**    | Contracts  | Everything  |                |
| **Infrastructure** | Contracts  | Contracts   | Everything     |

Inter-module dependencies:

| From \ To          | External Domain | External Application | External Infrastructure |
|:-------------------|:----------------|:---------------------|:------------------------|
| **Domain**         | Interface       |                      |                         |
| **Application**    |                 | Interface            |                         |
| **Infrastructure** |                 |                      | Interface               |

All inter-module dependencies should be used with caution.

The Cross-cutting Concerns module may not depend on any other module and the allowed dependencies on the Cross-cutting Concerns module is more relaxed than what is described in the table above.