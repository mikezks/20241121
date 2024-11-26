import { initialPassenger, Passenger } from './../../logic-passenger/model/passenger';
import { NgIf } from '@angular/common';
import { Component, effect, inject, Injector, input, numberAttribute, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { validatePassengerStatus } from '../../util-validation';
import { PassengerService } from '../../logic-passenger/data-access/passenger.service';
import { switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-passenger-edit',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './passenger-edit.component.html'
})
export class PassengerEditComponent {
  private passengerService = inject(PassengerService);
  private http = inject(HttpClient);
  private injector = inject(Injector);

  readonly id = input.required<number, string>({ transform: numberAttribute });

  protected editForm = inject(NonNullableFormBuilder).group({
    id: [0],
    firstName: [''],
    name: [''],
    bonusMiles: [0],
    passengerStatus: ['', [
      validatePassengerStatus(['A', 'B', 'C'])
    ]]
  });

  readonly passenger = toSignal(
    toObservable(this.id).pipe(
      switchMap(id => this.passengerService.findById(id))
    ), { initialValue: initialPassenger }
  );

  constructor() {
    effect(() => this.editForm.patchValue(this.passenger()));
  }

  protected save(): void {
    console.log(this.editForm.value);

    /* const passengerCall = toSignal(this.http.get<Passenger[]>('https://demo.angulararchitects.io/api/passenger?name=Smith'), {
      initialValue: [],
      injector: this.injector
    });
    effect(() => console.log(passengerCall()), {
      injector: this.injector,
      allowSignalWrites: true
    }); */
  }
}
