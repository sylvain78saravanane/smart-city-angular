import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageCommentaires } from './page-commentaires';

describe('PageCommentaires', () => {
  let component: PageCommentaires;
  let fixture: ComponentFixture<PageCommentaires>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageCommentaires]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageCommentaires);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
