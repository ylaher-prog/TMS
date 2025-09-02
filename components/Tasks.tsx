
import React, { useState, useMemo, useEffect } from 'react';
import type { TaskBoard, Teacher, Permission, TaskCard, TaskColumn } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, ClockIcon } from './Icons';
import AddEditBoardModal from './AddEditBoardModal';
import AddEditTaskModal from './AddEditTaskModal';
import { hasPermission } from '../permissions';
import ConfirmationModal from './ConfirmationModal';
import { PrimaryButton } from './FormControls';

interface TasksProps {
    boards: TaskBoard[];
    setBoards: React.Dispatch<React.SetStateAction<TaskBoard[]>>;
    allTeachers: Teacher[];
    currentUser: Teacher;
    permissions: Permission[];
}

const TaskCardDisplay: React.FC<{ 
    card: TaskCard; 
    onEdit: () => void;
    onDelete: () => void;
    allTeachers: Teacher[];
    permissions: Permission[];
}> = ({ card, onEdit, onDelete, allTeachers, permissions }) => {
    const assignedUser = card.assignedToId ? allTeachers.find(t => t.id === card.assignedToId) : null;
    
    const dueDateInfo = useMemo(() => {
        if (!card.dueDate) return { text: 'No due date', color: 'text-gray-500 dark:text-gray-400' };

        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        
        const [year, month, day] = card.dueDate.split('-').map(Number);
        const dueDate = new Date(Date.UTC(year, month - 1, day));
        
        if (dueDate.getTime() < todayUTC.getTime()) {
            return { text: card.dueDate, color: 'text-red-600 dark:text-red-400 font-semibold' }; // Overdue
        }
        if (dueDate.getTime() === todayUTC.getTime()) {
            return { text: 'Today', color: 'text-amber-600 dark:text-amber-400 font-semibold' }; // Due today
        }
        return { text: card.dueDate, color: 'text-gray-500 dark:text-gray-400' };
    }, [card.dueDate]);

    return (
        <div 
            onClick={onEdit}
            className="group relative bg-white dark:bg-slate-700 p-3 pl-5 rounded-md shadow-sm border dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600/50"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-l-md"></div>

            {hasPermission(permissions, 'manage:task-cards') && (
                 <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" title="Edit Task"><PencilIcon className="w-4 h-4"/></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-red-500 dark:hover:text-red-400" title="Delete Task"><TrashIcon className="w-4 h-4"/></button>
                </div>
            )}
            
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-10">{card.title}</p>
            <div className="flex items-center justify-between mt-2">
                <div className={`flex items-center gap-1.5 text-xs ${dueDateInfo.color}`}>
                    {card.dueDate && <ClockIcon className="w-3.5 h-3.5" />}
                    <span>{dueDateInfo.text}</span>
                </div>
                {assignedUser && (
                    <img src={assignedUser.avatarUrl} alt={assignedUser.fullName} className="w-6 h-6 rounded-full" title={`Assigned to ${assignedUser.fullName}`} />
                )}
            </div>
        </div>
    );
};

const TaskColumnDisplay: React.FC<{
    column: TaskColumn;
    tasks: TaskCard[];
    onAddTask: (columnId: string) => void;
    onEditTask: (task: TaskCard, columnId: string) => void;
    onDeleteTask: (task: TaskCard, columnId: string) => void;
    onRenameColumn: (columnId: string, newTitle: string) => void;
    onDeleteColumn: (columnId: string) => void;
    onDragStart: (e: React.DragEvent, taskId: string, sourceColumnId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetColumnId: string) => void;
    allTeachers: Teacher[];
    permissions: Permission[];
}> = (props) => {
    const { column, tasks, onAddTask, onEditTask, onDeleteTask, onRenameColumn, onDeleteColumn, onDragStart, onDragOver, onDrop, allTeachers, permissions } = props;
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(column.title);

    const handleRename = () => {
        if (title.trim()) {
            onRenameColumn(column.id, title.trim());
        }
        setIsRenaming(false);
    };

    return (
        <div 
            className="w-72 bg-gray-100 dark:bg-slate-800/60 rounded-lg p-3 flex-shrink-0 flex flex-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
        >
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
                {isRenaming ? (
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                        className="font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-b-2 border-brand-primary w-full"
                    />
                ) : (
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">{column.title} ({tasks.length})</h3>
                )}
                {hasPermission(permissions, 'manage:task-columns') && (
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsRenaming(true)} className="text-gray-400 hover:text-gray-600"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteColumn(column.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                {tasks.map(task => (
                    <div key={task.id} draggable={hasPermission(permissions, 'manage:task-cards')} onDragStart={(e) => hasPermission(permissions, 'manage:task-cards') && onDragStart(e, task.id, column.id)}>
                        <TaskCardDisplay 
                            card={task} 
                            onEdit={() => onEditTask(task, column.id)} 
                            onDelete={() => onDeleteTask(task, column.id)}
                            allTeachers={allTeachers}
                            permissions={permissions}
                        />
                    </div>
                ))}
            </div>
            {hasPermission(permissions, 'manage:task-cards') && (
                <button onClick={() => onAddTask(column.id)} className="w-full text-left mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 flex-shrink-0">
                    + Add a card
                </button>
            )}
        </div>
    );
};

const Tasks: React.FC<TasksProps> = ({ boards, setBoards, allTeachers, currentUser, permissions }) => {
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [boardToEdit, setBoardToEdit] = useState<TaskBoard | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<{ task: TaskCard, columnId: string } | null>(null);
    const [columnForNewTask, setColumnForNewTask] = useState<string | null>(null);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<{ task: TaskCard, columnId: string } | null>(null);

    const visibleBoards = useMemo(() => {
        if (hasPermission(permissions, 'manage:task-boards')) return boards;
        return boards.filter(b => b.memberIds.includes(currentUser.id));
    }, [boards, currentUser.id, permissions]);

    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(visibleBoards[0]?.id || null);

    useEffect(() => {
        if (!selectedBoardId && visibleBoards.length > 0) {
            setSelectedBoardId(visibleBoards[0].id);
        } else if (selectedBoardId && !visibleBoards.find(b => b.id === selectedBoardId)) {
            setSelectedBoardId(visibleBoards[0]?.id || null);
        }
    }, [visibleBoards, selectedBoardId]);

    const activeBoard = useMemo(() => boards.find(b => b.id === selectedBoardId), [boards, selectedBoardId]);
    
    const handleSaveBoard = (board: TaskBoard) => {
        setBoards(prev => {
            const exists = prev.some(b => b.id === board.id);
            return exists ? prev.map(b => b.id === board.id ? board : b) : [...prev, board];
        });
        setIsBoardModalOpen(false);
        setBoardToEdit(null);
    };

    const handleAddColumn = () => {
        if (!activeBoard) return;
        const newColumn: TaskColumn = {
            id: `col-${Date.now()}`,
            title: "New Column",
            cardIds: [],
        };
        const updatedBoard = { ...activeBoard, columns: [...activeBoard.columns, newColumn] };
        handleSaveBoard(updatedBoard);
    };

    const handleRenameColumn = (columnId: string, newTitle: string) => {
        if (!activeBoard) return;
        const updatedColumns = activeBoard.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c);
        handleSaveBoard({ ...activeBoard, columns: updatedColumns });
    };

    const handleDeleteColumn = () => {
        if (!activeBoard || !columnToDelete) return;
        const column = activeBoard.columns.find(c => c.id === columnToDelete);
        if (!column) return;
        
        const taskIdsToDelete = new Set(column.cardIds);
        const updatedTasks = activeBoard.tasks.filter(t => !taskIdsToDelete.has(t.id));
        const updatedColumns = activeBoard.columns.filter(c => c.id !== columnToDelete);

        handleSaveBoard({ ...activeBoard, tasks: updatedTasks, columns: updatedColumns });
        setColumnToDelete(null);
    };

    const handleSaveTask = (task: TaskCard) => {
        if (!activeBoard) return;
        let updatedBoard: TaskBoard;
        if (taskToEdit) {
            updatedBoard = { ...activeBoard, tasks: activeBoard.tasks.map(t => t.id === task.id ? task : t) };
        } else {
            const newCard = { ...task, id: `task-${Date.now()}` };
            updatedBoard = {
                ...activeBoard,
                tasks: [...activeBoard.tasks, newCard],
                columns: activeBoard.columns.map(c => c.id === columnForNewTask ? { ...c, cardIds: [...c.cardIds, newCard.id] } : c)
            };
        }
        handleSaveBoard(updatedBoard);
        setIsTaskModalOpen(false);
        setTaskToEdit(null);
        setColumnForNewTask(null);
    };

    const handleDeleteTask = () => {
        if (!activeBoard || !taskToDelete) return;
        const { task, columnId } = taskToDelete;
        const updatedTasks = activeBoard.tasks.filter(t => t.id !== task.id);
        const updatedColumns = activeBoard.columns.map(c => 
            c.id === columnId 
            ? { ...c, cardIds: c.cardIds.filter(id => id !== task.id) } 
            : c
        );
        handleSaveBoard({ ...activeBoard, tasks: updatedTasks, columns: updatedColumns });
        setTaskToDelete(null);
    };
    
    const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumnId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('sourceColumnId', sourceColumnId);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        if (!activeBoard) return;
        const taskId = e.dataTransfer.getData('taskId');
        const sourceColumnId = e.dataTransfer.getData('sourceColumnId');

        if (!taskId || sourceColumnId === targetColumnId) return;

        const updatedColumns = activeBoard.columns.map(col => {
            if (col.id === sourceColumnId) return { ...col, cardIds: col.cardIds.filter(id => id !== taskId) };
            if (col.id === targetColumnId) return { ...col, cardIds: [...col.cardIds, taskId] };
            return col;
        });
        
        handleSaveBoard({ ...activeBoard, columns: updatedColumns });
    };

    return (
        <div className="flex flex-col h-full w-full">
            <header className="flex-shrink-0 p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-800/50 rounded-t-xl">
                <div>
                     <select 
                        value={selectedBoardId || ''} 
                        onChange={e => setSelectedBoardId(e.target.value)}
                        className="text-lg font-bold bg-transparent dark:text-white focus:outline-none"
                    >
                        {visibleBoards.map(board => <option key={board.id} value={board.id}>{board.title}</option>)}
                        {visibleBoards.length === 0 && <option disabled>No boards available</option>}
                    </select>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {activeBoard && hasPermission(permissions, 'manage:task-boards') && (
                        <button onClick={() => { setBoardToEdit(activeBoard); setIsBoardModalOpen(true); }} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">Edit Board</button>
                    )}
                    {hasPermission(permissions, 'manage:task-boards') && (
                        <PrimaryButton onClick={() => { setBoardToEdit(null); setIsBoardModalOpen(true); }}><PlusIcon className="w-4 h-4 mr-1"/> New Board</PrimaryButton>
                    )}
                </div>
            </header>

            <main className="flex-1 flex gap-4 p-4 overflow-x-auto bg-gray-50 dark:bg-slate-900/50 rounded-b-xl">
                {activeBoard ? (
                    <>
                        {activeBoard.columns.map(col => (
                            <TaskColumnDisplay
                                key={col.id}
                                column={col}
                                tasks={col.cardIds.map(id => activeBoard.tasks.find(t => t.id === id)!).filter(Boolean)}
                                onAddTask={(columnId) => { setColumnForNewTask(columnId); setTaskToEdit(null); setIsTaskModalOpen(true); }}
                                onEditTask={(task, columnId) => { setTaskToEdit({ task, columnId }); setIsTaskModalOpen(true); }}
                                onDeleteTask={(task, columnId) => setTaskToDelete({task, columnId})}
                                onRenameColumn={handleRenameColumn}
                                onDeleteColumn={(columnId) => setColumnToDelete(columnId)}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                allTeachers={allTeachers}
                                permissions={permissions}
                            />
                        ))}
                        {hasPermission(permissions, 'manage:task-columns') && (
                            <button onClick={handleAddColumn} className="w-72 flex-shrink-0 bg-gray-200/50 dark:bg-slate-800/40 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 font-semibold">
                                + Add another list
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No boards to display</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new board to get started with task management.</p>
                        </div>
                    </div>
                )}
            </main>

            {isBoardModalOpen && (
                <AddEditBoardModal
                    isOpen={isBoardModalOpen}
                    onClose={() => setIsBoardModalOpen(false)}
                    onSave={handleSaveBoard}
                    existingBoard={boardToEdit}
                    allTeachers={allTeachers}
                />
            )}
             {isTaskModalOpen && (
                <AddEditTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSave={handleSaveTask}
                    existingTask={taskToEdit?.task}
                    boardMembers={activeBoard ? allTeachers.filter(t => activeBoard.memberIds.includes(t.id)) : []}
                />
            )}
            {columnToDelete && (
                <ConfirmationModal 
                    isOpen={!!columnToDelete}
                    onClose={() => setColumnToDelete(null)}
                    onConfirm={handleDeleteColumn}
                    title="Delete Column"
                    message={`Are you sure you want to delete the "${activeBoard?.columns.find(c => c.id === columnToDelete)?.title}" column? All tasks within it will also be deleted.`}
                />
            )}
            {taskToDelete && (
                <ConfirmationModal 
                    isOpen={!!taskToDelete}
                    onClose={() => setTaskToDelete(null)}
                    onConfirm={handleDeleteTask}
                    title="Delete Task"
                    message={`Are you sure you want to delete the task "${taskToDelete.task.title}"?`}
                />
            )}
        </div>
    );
};

export default Tasks;
