'use client';
import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

const MaskedInput = forwardRef<HTMLInputElement, React.ComponentProps<typeof IMaskInput>>(
    (props, ref) => (
        <IMaskInput
            {...props}
            inputRef={ref}
        />
    )
);

MaskedInput.displayName = 'MaskedInput';

export default MaskedInput;