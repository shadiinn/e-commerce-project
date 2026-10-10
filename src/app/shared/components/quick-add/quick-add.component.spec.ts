import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickAddComponent } from './quick-add.component';

describe('QuickAddComponent', () => {
  let component: QuickAddComponent;
  let fixture: ComponentFixture<QuickAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
