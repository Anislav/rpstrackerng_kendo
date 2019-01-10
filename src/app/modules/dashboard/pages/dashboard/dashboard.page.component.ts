import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardFilter } from '../../repositories/dashboard.repository';
import { Store } from 'src/app/core/state/app-store';
import { StatusCounts } from '../../models';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { PtUserService } from 'src/app/core/services';
import { PtUser } from 'src/app/core/models/domain';


interface DateRange {
    dateStart: Date;
    dateEnd: Date;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.page.component.html',
    styleUrls: ['dashboard.page.component.css']
})
export class DashboardPageComponent implements OnInit, OnDestroy {

    private sub: Subscription | undefined;
    public filter: DashboardFilter = {};
    public filteredDateStart: Date | undefined;
    public filteredDateEnd: Date | undefined;

    public statusCounts$: BehaviorSubject<StatusCounts> = new BehaviorSubject<StatusCounts>({
        activeItemsCount: 0,
        closeRate: 0,
        closedItemsCount: 0,
        openItemsCount: 0
    });

    public users$: Observable<PtUser[]> = this.store.select<PtUser[]>('users');

    private get currentUserId() {
        if (this.store.value.currentUser) {
            return this.store.value.currentUser.id;
        } else {
            return undefined;
        }
    }

    constructor(
        private dashboardService: DashboardService,
        private userService: PtUserService,
        private store: Store
    ) { }

    public ngOnInit() {
        this.refresh();
    }

    public userFilterOpen() {
        this.userService.fetchUsers();
    }

    public userFilterValueChange(user: PtUser | undefined) {
        if (user) {
            this.filter.userId = user.id;
        } else {
            this.filter.userId = undefined;
        }
        this.refresh();
    }

    public onMonthRangeTap(months: number) {
        const range = this.getDateRange(months);
        this.filteredDateStart = range.dateStart;
        this.filteredDateEnd = range.dateEnd;
        this.filter = {
            userId: this.filter.userId,
            dateEnd: range.dateEnd,
            dateStart: range.dateStart
        };
        this.refresh();
    }

    private refresh() {
        this.sub = this.dashboardService.getStatusCounts(this.filter)
            .subscribe(result => {
                this.statusCounts$.next(result);
            });
    }

    public ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    private getDateRange(months: number): DateRange {
        const now = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - months);
        return {
            dateStart: start,
            dateEnd: now
        };
    }
}
