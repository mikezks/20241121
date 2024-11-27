import { Component, Input, effect, inject, input, numberAttribute } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingStore, Flight, initialFlight } from '../../logic-flight';


@Component({
  selector: 'app-flight-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './flight-edit.component.html'
})
export class FlightEditComponent {
  private store = inject(BookingStore);

  protected id = input.required<number, string>({ transform: numberAttribute});
  @Input() flight = initialFlight;

  protected editForm = inject(NonNullableFormBuilder).group({
    id: [0],
    from: ['', [
      Validators.minLength(5)
    ]],
    to: [''],
    date: [new Date().toISOString()],
    delayed: [false]
  });

  constructor() {
    this.store.setActiveId(this.id);

    effect(() => {
      const activeFlight = this.store.activeFlight();
      // Form is not updated if there are active changes.
      // Refactoring option: avoid navigation is this case (Router Guard).
      if (this.editForm.pristine) {
        this.editForm.patchValue(activeFlight);
      } else {
        console.log('Flight update was not written to the form', activeFlight);
      }
    });

    // Demo: more performant EntityState data type
    const entityStateFlight: {
      entities: Record<number, Flight>,
      ids: number[]
    } = {
      entities: {
        3: {
          id: 3,
          from: 'Hamburg',
          to: 'Graz',
          date: '',
          delayed: false
        },
        5: {
          id: 5,
          from: 'Hamburg',
          to: 'Graz',
          date: '',
          delayed: false
        },
      },
      ids: [5, 3]
    };

    entityStateFlight.entities[4];
    const flights = entityStateFlight.ids.map(
      id => entityStateFlight.entities[id]
    );
  }

  protected save(): void {
    this.store.saveFlightUpdate(
      this.editForm.getRawValue()
    );
  }
}
