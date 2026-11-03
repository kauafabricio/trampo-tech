import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SuaTrilhaPage } from './sua-trilha.page';

describe('SuaTrilhaPage', () => {
  let component: SuaTrilhaPage;
  let fixture: ComponentFixture<SuaTrilhaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    fixture = TestBed.createComponent(SuaTrilhaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
