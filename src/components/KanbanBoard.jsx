import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import { STAGES, STAGE_DOT, STAGE_ACCENT } from './stages';

export default function KanbanBoard({ applications, onCardClick, onDragEnd, onAddToStage }) {
  const [activeCol, setActiveCol] = useState(null);

  const byStage = (stage) => applications.filter((a) => (a.status || 'wishlist') === stage);

  return (
    <DragDropContext
      onDragEnd={(result) => {
        setActiveCol(null);
        onDragEnd(result);
      }}
    >
      <div className="flex gap-4 h-full overflow-x-auto scrollbar-thin px-6 pb-6">
        {STAGES.map((stage) => {
          const items = byStage(stage.key);
          return (
            <div key={stage.key} className="flex flex-col min-w-[280px] w-[280px] shrink-0">
              {/* Column header */}
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-2 ${STAGE_ACCENT[stage.key]} bg-secondary/50`}
                onMouseEnter={() => setActiveCol(stage.key)}
                onMouseLeave={() => setActiveCol(null)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STAGE_DOT[stage.key]}`} />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    {stage.label}
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddToStage(stage.key)}
                  className={`p-1 rounded-md transition-colors ${
                    activeCol === stage.key
                      ? 'text-primary opacity-100'
                      : 'text-muted-foreground opacity-0'
                  } hover:bg-primary/10`}
                  title={`Add to ${stage.label}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2.5 p-2.5 rounded-b-xl border border-t-0 border-border bg-secondary/30 min-h-[120px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    {items.map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(prov, snap) => (
                          <ApplicationCard
                            application={app}
                            onClick={() => onCardClick(app)}
                            provided={prov}
                            snapshot={snap}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40 border border-dashed border-border/60 rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
