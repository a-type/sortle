import {
  DndContext,
  useDroppable,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import clsx from 'clsx';
import { forwardRef, ReactNode } from 'react';
import { useSnapshot } from 'valtio';
import { gameState, getRuleMatchState } from '../lib/game';
import styles from '../styles/tiles.module.css';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

export interface TileProps {
  tileNumber: number;
  className?: string;
  index: number;
  children?: ReactNode;
}

const tileSymbols = ['A', 'B', 'C', 'D', 'E'];

export const Tile = forwardRef<HTMLDivElement, TileProps>(function Tile(
  { tileNumber, index, className, ...rest },
  ref,
) {
  const matchState = useTileMatchState(tileNumber);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: tileNumber.toString(),
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={clsx(
        styles.tile,
        {
          [styles.tileMatch]: matchState === 'match',
          [styles.tilePartial]: matchState === 'partial-match',
        },
        className,
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...rest}
    >
      {tileSymbols[tileNumber]}
    </div>
  );
});

function useTileMatchState(tileNumber: number) {
  const state = useSnapshot(gameState);
  const rules = state.tileRules[tileNumber];
  return getRuleMatchState(rules, state.tileOrder, tileNumber);
}

export interface TileListProps {
  className?: string;
}

export const TileList = forwardRef<HTMLDivElement, TileListProps>(
  function TileList({ className, ...rest }, ref) {
    const tileOrder = useSnapshot(gameState.tileOrder);
    const reorder = (movedId: string, overId: string) => {
      const movedTile = parseInt(movedId);
      const sourceIndex = tileOrder.indexOf(movedTile);
      const overTile = parseInt(overId);
      const destinationIndex = tileOrder.indexOf(overTile);
      const newTileOrder = [...tileOrder];
      gameState.tileOrder.splice(sourceIndex, 1);
      gameState.tileOrder.splice(destinationIndex, 0, movedTile);
      // gameState.tileOrder = newTileOrder;
      console.log(gameState.tileOrder);
    };
    const { isOver, setNodeRef } = useDroppable({
      id: 'tile-list',
    });

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(TouchSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    console.log('rerendering list', tileOrder);

    return (
      <DndContext
        onDragEnd={(event) => {
          console.log('reorder', event.active.id, 'to', event.over.id);
          reorder(event.active.id, event.over.id);
        }}
        sensors={sensors}
        modifiers={[restrictToHorizontalAxis]}
      >
        <div
          ref={setNodeRef}
          className={clsx(styles.tileList, className)}
          {...rest}
        >
          <SortableContext
            items={tileOrder.map((i) => i.toString())}
            strategy={horizontalListSortingStrategy}
          >
            {tileOrder.map((tileNumber, index) => (
              <Tile key={tileNumber} tileNumber={tileNumber} index={index} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    );
  },
);
