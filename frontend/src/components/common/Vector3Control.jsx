import { Box, Grid, Slider, Typography } from '@mui/material';


export const Vector3Control = ({
    value,
    onChange,
    min = -1,
    max = 1,
    step = 0.01,
    labels = ['X', 'Y', 'Z'],
}: Vector3ControlProps) => {
    const handleChange = (index: number, newValue: number) => {
        const newVector = [...value] as [number, number, number];
        newVector[index] = newValue;
        onChange(newVector);
    };

    return (
        
            <Grid container spacing={2}>
                {value.map((component, index) => (
                    <Grid item xs={12} key={index}>
                        <Typography variant="body2" gutterBottom>
                            {labels[index]}
                        </Typography>
                        <Slider
                            value={component}
                            min={min}
                            max={max}
                            step={step}
                            onChange={(_, value) =>
                                handleChange(index, value as number)
                            }
                            valueLabelDisplay="auto"
                            marks={[
                                { value: min, label: min.toString() },
                                { value: 0, label: '0' },
                                { value: max, label: max.toString() },
                            ]}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Vector3Control;
