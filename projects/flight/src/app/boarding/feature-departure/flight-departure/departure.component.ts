import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';
import { Flight, FlightService } from '../../../booking/api-boarding';


@Component({
  selector: 'app-departure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './departure.component.html'
})
export class DepatureComponent {
  private flightService = inject(FlightService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  control = new FormControl('', { nonNullable: true });
  flights$ = this.initFlightsStream();
  loading = false;

  constructor() {
    this.destroyRef.onDestroy(() => console.log('Bye, bye! :('));
  }

  initFlightsStream(): Observable<Flight[]> {
    /* const state = [{
      id: 9,
      from: 'Paris',
      to: 'London',
      date: new Date().toISOString(),
      delayed: true
    }];

    type FlightState = {
      flights: Flight[];
      status: 'init' | 'loading' | 'loaded' | 'error';
    }

    const state2: FlightState = {
      flights: [{
        id: 9,
        from: 'Paris',
        to: 'London',
        date: new Date().toISOString(),
        delayed: true
      }],
      status: 'init' // 'loading', 'loaded', 'error'
    }; */

    return this.control.valueChanges.pipe(
      tap(v => console.log(v)),
      filter(airport => airport.length > 2),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading = true),
      switchMap(airport => this.load(airport)),
      tap(() => this.loading = false),
      takeUntilDestroyed(/* this.destroyRef */)
    );
  }

  load(airport: string): Observable<Flight[]> {
    // const flightService = runInInjectionContext(this.injector, () => inject(FlightService));
    // this.injector.get(FlightService);
    of(true).pipe(
      takeUntilDestroyed()
    );
    return this.flightService.find(airport, '').pipe(
      catchError(() => of([]))
    );
  }
}
