// Widget Management System
class WidgetSystem {
    constructor() {
        this.widgets = new Map();
        this.layout = [];
        this.gridStack = null;
    }

    init() {
        this.setupGrid();
        this.loadUserPreferences();
        this.setupEventListeners();
    }

    setupGrid() {
        this.gridStack = GridStack.init({
            column: 12,
            cellHeight: 80,
            animate: true,
            draggable: {
                handle: '.widget-header'
            },
            float: true
        });

        this.gridStack.on('change', () => this.saveLayout());
    }

    async loadUserPreferences() {
        try {
            const response = await fetch('/api/widgets/preferences');
            if (response.ok) {
                const preferences = await response.json();
                this.applyLayout(preferences.layout);
            }
        } catch (error) {
            console.error('Error loading widget preferences:', error);
        }
    }

    applyLayout(layout) {
        layout.forEach(widget => {
            this.addWidget(widget.type, widget.position);
        });
    }

    addWidget(type, position = null) {
        const widget = this.createWidget(type);
        if (position) {
            widget.setAttribute('gs-x', position.x);
            widget.setAttribute('gs-y', position.y);
            widget.setAttribute('gs-w', position.w);
            widget.setAttribute('gs-h', position.h);
        }
        this.gridStack.addWidget(widget);
        this.initializeWidgetContent(widget, type);
    }

    createWidget(type) {
        const widget = document.createElement('div');
        widget.className = 'grid-stack-item';
        widget.innerHTML = `
            <div class="grid-stack-item-content card">
                <div class="widget-header card-header d-flex justify-content-between align-items-center">
                    <h5 class="m-0">${this.getWidgetTitle(type)}</h5>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-outline-secondary refresh-widget">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger remove-widget">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body widget-content" data-widget-type="${type}">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    async initializeWidgetContent(widget, type) {
        const contentElement = widget.querySelector('.widget-content');
        try {
            const response = await fetch(`/api/widgets/${type}/data`);
            if (response.ok) {
                const data = await response.json();
                contentElement.innerHTML = this.renderWidgetContent(type, data);
            }
        } catch (error) {
            console.error(`Error loading widget ${type} data:`, error);
            contentElement.innerHTML = '<div class="alert alert-danger">Failed to load widget data</div>';
        }
    }

    getWidgetTitle(type) {
        const titles = {
            'task_summary': 'Task Summary',
            'progress_chart': 'Progress Chart',
            'recent_activity': 'Recent Activity',
            'quick_actions': 'Quick Actions',
            'milestone_tracker': 'Milestone Tracker'
        };
        return titles[type] || 'Widget';
    }

    renderWidgetContent(type, data) {
        switch (type) {
            case 'task_summary':
                return this.renderTaskSummary(data);
            case 'progress_chart':
                return this.renderProgressChart(data);
            case 'recent_activity':
                return this.renderRecentActivity(data);
            case 'quick_actions':
                return this.renderQuickActions(data);
            case 'milestone_tracker':
                return this.renderMilestoneTracker(data);
            default:
                return '<div class="alert alert-warning">Unknown widget type</div>';
        }
    }

    renderTaskSummary(data) {
        return `
            <div class="task-summary">
                <div class="d-flex justify-content-between mb-3">
                    <div>
                        <h6>Active Tasks</h6>
                        <h3>${data.active_count}</h3>
                    </div>
                    <div>
                        <h6>Completed Today</h6>
                        <h3>${data.completed_today}</h3>
                    </div>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar bg-success" 
                         role="progressbar" 
                         style="width: ${data.completion_rate}%">
                    </div>
                </div>
            </div>
        `;
    }

    renderProgressChart(data) {
        const ctx = document.createElement('canvas');
        new Chart(ctx, {
            type: 'line',
            data: data.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        return ctx.outerHTML;
    }

    renderRecentActivity(data) {
        return `
            <div class="recent-activity">
                ${data.activities.map(activity => `
                    <div class="activity-item">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi ${activity.icon} me-2"></i>
                            <span>${activity.description}</span>
                        </div>
                        <small class="text-muted">${activity.time}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderQuickActions(data) {
        return `
            <div class="quick-actions">
                <div class="row g-2">
                    ${data.actions.map(action => `
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100" 
                                    onclick="widgetSystem.handleQuickAction('${action.id}')">
                                <i class="bi ${action.icon}"></i>
                                ${action.label}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMilestoneTracker(data) {
        return `
            <div class="milestone-tracker">
                ${data.milestones.map(milestone => `
                    <div class="milestone-item mb-2">
                        <div class="d-flex justify-content-between">
                            <span>${milestone.title}</span>
                            <span class="badge ${milestone.completed ? 'bg-success' : 'bg-secondary'}">
                                ${milestone.due_date}
                            </span>
                        </div>
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar" 
                                 role="progressbar" 
                                 style="width: ${milestone.progress}%">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async saveLayout() {
        const layout = this.gridStack.save();
        try {
            await fetch('/api/widgets/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ layout })
            });
        } catch (error) {
            console.error('Error saving widget layout:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-widget')) {
                const widget = e.target.closest('.grid-stack-item');
                this.gridStack.removeWidget(widget);
                this.saveLayout();
            } else if (e.target.closest('.refresh-widget')) {
                const widget = e.target.closest('.grid-stack-item');
                const type = widget.querySelector('.widget-content').dataset.widgetType;
                this.initializeWidgetContent(widget, type);
            }
        });

        // Add widget button
        document.getElementById('addWidgetBtn')?.addEventListener('click', () => {
            const type = document.getElementById('widgetTypeSelect').value;
            this.addWidget(type);
        });
    }

    async handleQuickAction(actionId) {
        try {
            const response = await fetch(`/api/widgets/actions/${actionId}`, { method: 'POST' });
            if (response.ok) {
                // Refresh relevant widgets
                this.refreshWidgetsByType(['task_summary', 'recent_activity']);
            }
        } catch (error) {
            console.error('Error executing quick action:', error);
        }
    }

    refreshWidgetsByType(types) {
        document.querySelectorAll('.widget-content').forEach(widget => {
            if (types.includes(widget.dataset.widgetType)) {
                this.initializeWidgetContent(widget.closest('.grid-stack-item'), widget.dataset.widgetType);
            }
        });
    }
}

// Initialize widget system when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.widgetSystem = new WidgetSystem();
    widgetSystem.init();
});
