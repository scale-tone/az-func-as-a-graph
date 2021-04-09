
import { DurableEntityStateContainer } from '../../common/DurableEntityStateContainer';
import { VisibilityEnum } from '../../common/DurableEntity';

test('adds owner to allowedUsers', () => {

    const owner = 'some user';
    const container = new DurableEntityStateContainer({}, VisibilityEnum.ToListOfUsers, owner);

    expect(container.__metadata.allowedUsers).toContain(owner);
});

test('denies access when visibility is unknown', () => {

    const container = new DurableEntityStateContainer({}, 12345678, 'some user');

    expect(DurableEntityStateContainer.isAccessAllowed(container, 'some other user')).toBeFalsy;
});

test('denies access for non-owner', () => {

    const container = new DurableEntityStateContainer({}, VisibilityEnum.ToOwnerOnly, 'some user');

    expect(DurableEntityStateContainer.isAccessAllowed(container, 'some other user')).toBeFalsy;
});

test('denies access for not member of the group', () => {

    const container = new DurableEntityStateContainer({}, VisibilityEnum.ToListOfUsers, 'some user', ['userA', 'userB']);

    expect(DurableEntityStateContainer.isAccessAllowed(container, 'some other user')).toBeFalsy;
});
